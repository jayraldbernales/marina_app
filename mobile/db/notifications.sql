CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('buyer', 'vendor', 'rider')), -- ADD THIS
  type text NOT NULL,
  title text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  related_id uuid,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notifications_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);

CREATE OR REPLACE FUNCTION public.notify_new_order() RETURNS trigger AS $$
DECLARE
  buyer_name text;
  vendor_name text;
BEGIN
  -- Get buyer name
  SELECT full_name INTO buyer_name 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Get vendor shop name
  SELECT shop_name INTO vendor_name 
  FROM public.vendor_profiles 
  WHERE user_id = NEW.vendor_user_id;
  
  -- Notify the vendor about the new order
  IF NEW.vendor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, 
      user_type,  -- ADD THIS
      type, 
      title, 
      message, 
      metadata
    ) VALUES (
      NEW.vendor_user_id,
      'vendor',  -- user_type
      'order',
      'New Order Received',
      concat('New order #', NEW.order_number, ' from ', COALESCE(buyer_name, 'a customer')),
      jsonb_build_object(
        'order_id', NEW.order_id,
        'order_number', NEW.order_number,
        'total_amount', NEW.total_amount
      )
    );
  END IF;

  -- Notify buyer that order is confirmed
  INSERT INTO public.notifications (
    user_id, 
    user_type, 
    type, 
    title, 
    message, 
    metadata
  ) VALUES (
    NEW.user_id,
    'buyer',
    'order',
    'Order Confirmed',
    concat('Your order #', NEW.order_number, ' has been placed with ', COALESCE(vendor_name, 'the vendor')),
    jsonb_build_object(
      'order_id', NEW.order_id,
      'order_number', NEW.order_number,
      'vendor_id', NEW.vendor_user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS trigger AS $$
DECLARE
  conv RECORD;
  sender_name text;
  sender_role text;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF conv IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender info
  SELECT full_name, role INTO sender_name, sender_role 
  FROM public.profiles 
  WHERE user_id = NEW.sender_id;

  -- Notify other participants
  -- If sender is buyer, notify vendor and rider
  IF NEW.sender_id = conv.buyer_id THEN
    -- Notify vendor
    IF conv.vendor_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.vendor_id, 
        'vendor',
        'message', 
        'New Message from Buyer',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
    
    -- Notify rider if present
    IF conv.rider_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.rider_id,
        'rider',
        'message',
        'New Message from Buyer',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
  ELSE
    -- Sender is vendor/rider, notify buyer
    IF conv.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.buyer_id,
        'buyer',
        'message',
        concat('New Message from ', sender_role),
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Notify when delivery status changes
CREATE OR REPLACE FUNCTION public.notify_delivery_update() RETURNS trigger AS $$
DECLARE
  order_record RECORD;
  status_message text;
BEGIN
  -- Get the related order
  SELECT * INTO order_record FROM public.orders WHERE order_id = NEW.order_id;
  
  -- Set appropriate message based on status
  status_message := CASE NEW.status
    WHEN 'assigned' THEN 'A rider has been assigned to your order'
    WHEN 'picked_up' THEN 'Your order has been picked up'
    WHEN 'delivered' THEN 'Your order has been delivered!'
    WHEN 'failed' THEN 'Delivery attempt failed'
    ELSE concat('Delivery status updated to: ', NEW.status)
  END;
  
  -- Notify buyer
  IF order_record.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      order_record.user_id,
      'buyer',
      'delivery',
      'Delivery Update',
      status_message,
      jsonb_build_object(
        'delivery_id', NEW.delivery_id,
        'order_id', NEW.order_id,
        'status', NEW.status
      )
    );
  END IF;
  
  -- If assigned to a rider, notify them too
  IF NEW.status = 'assigned' AND NEW.rider_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      NEW.rider_user_id,
      'rider',
      'delivery',
      'New Delivery Assigned',
      concat('Order #', order_record.order_number, ' ready for pickup'),
      jsonb_build_object(
        'delivery_id', NEW.delivery_id,
        'order_id', NEW.order_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_delivery_update
AFTER UPDATE OF status ON public.deliveries
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_delivery_update();

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own notifications
CREATE POLICY "users_select_own_notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to UPDATE their own notifications (for marking as read)
CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow triggers to INSERT (system notifications)
CREATE POLICY "system_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);  -- Triggers run with security definer


  -- Add this to your existing SQL - trigger for order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_change() RETURNS trigger AS $$
DECLARE
  buyer_name text;
  vendor_name text;
BEGIN
  -- Only notify if status changed
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    -- Get buyer name
    SELECT full_name INTO buyer_name 
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    -- Get vendor shop name
    SELECT shop_name INTO vendor_name 
    FROM public.vendor_profiles 
    WHERE user_id = NEW.vendor_user_id;
    
    -- Notify buyer
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      NEW.user_id,
      'buyer',
      'order',
      'Order Status Updated',
      format('Your order #%s is now: %s', NEW.order_number, NEW.order_status),
      jsonb_build_object(
        'order_id', NEW.order_id,
        'order_number', NEW.order_number,
        'status', NEW.order_status
      )
    );
    
    -- Notify vendor
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      NEW.vendor_user_id,
      'vendor',
      'order',
      'Order Status Changed',
      format('Order #%s status: %s', NEW.order_number, NEW.order_status),
      jsonb_build_object(
        'order_id', NEW.order_id,
        'order_number', NEW.order_number,
        'status', NEW.order_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE OF order_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- 1. New Order Trigger (for when orders are created)
CREATE OR REPLACE FUNCTION public.notify_new_order() RETURNS trigger AS $$
DECLARE
  buyer_name text;
  vendor_name text;
BEGIN
  -- Get buyer name
  SELECT full_name INTO buyer_name 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Get vendor shop name
  SELECT shop_name INTO vendor_name 
  FROM public.vendor_profiles 
  WHERE user_id = NEW.vendor_user_id;
  
  -- Notify vendor about new order
  INSERT INTO public.notifications (
    user_id, user_type, type, title, message, metadata
  ) VALUES (
    NEW.vendor_user_id,
    'vendor',
    'order',
    'New Order Received',
    concat('New order #', NEW.order_number, ' from ', COALESCE(buyer_name, 'a customer')),
    jsonb_build_object(
      'order_id', NEW.order_id, 
      'order_number', NEW.order_number,
      'total_amount', NEW.total_amount
    )
  );

  -- Notify buyer that order is confirmed
  INSERT INTO public.notifications (
    user_id, user_type, type, title, message, metadata
  ) VALUES (
    NEW.user_id,
    'buyer',
    'order',
    'Order Confirmed',
    concat('Your order #', NEW.order_number, ' has been placed with ', COALESCE(vendor_name, 'the vendor')),
    jsonb_build_object(
      'order_id', NEW.order_id, 
      'order_number', NEW.order_number
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();

-- 2. Order Status Change Trigger (for when order status updates)
CREATE OR REPLACE FUNCTION public.notify_order_status_change() RETURNS trigger AS $$
DECLARE
  buyer_name text;
  vendor_name text;
BEGIN
  -- Only notify if status actually changed
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    -- Get buyer name
    SELECT full_name INTO buyer_name 
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    -- Get vendor shop name
    SELECT shop_name INTO vendor_name 
    FROM public.vendor_profiles 
    WHERE user_id = NEW.vendor_user_id;
    
    -- Notify buyer
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      NEW.user_id,
      'buyer',
      'order',
      'Order Status Updated',
      format('Your order #%s is now: %s', NEW.order_number, NEW.order_status),
      jsonb_build_object(
        'order_id', NEW.order_id, 
        'order_number', NEW.order_number, 
        'status', NEW.order_status
      )
    );
    
    -- Notify vendor
    INSERT INTO public.notifications (
      user_id, user_type, type, title, message, metadata
    ) VALUES (
      NEW.vendor_user_id,
      'vendor',
      'order',
      'Order Status Changed',
      format('Order #%s status: %s', NEW.order_number, NEW.order_status),
      jsonb_build_object(
        'order_id', NEW.order_id, 
        'order_number', NEW.order_number, 
        'status', NEW.order_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_order_status_change ON public.orders;
CREATE TRIGGER trg_notify_order_status_change
AFTER UPDATE OF order_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- 3. Message Notification Trigger (optional - for real-time message notifications)
CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS trigger AS $$
DECLARE
  conv RECORD;
  sender_name text;
  sender_role text;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF conv IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender info
  SELECT full_name, role INTO sender_name, sender_role 
  FROM public.profiles 
  WHERE user_id = NEW.sender_id;

  -- Notify other participants based on who sent the message
  IF NEW.sender_id = conv.buyer_id THEN
    -- Buyer sent message - notify vendor and rider
    IF conv.vendor_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.vendor_id, 
        'vendor',
        'message', 
        'New Message from Buyer',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
    
    IF conv.rider_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.rider_id,
        'rider',
        'message',
        'New Message from Buyer',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
  ELSIF NEW.sender_id = conv.vendor_id THEN
    -- Vendor sent message - notify buyer and rider
    IF conv.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.buyer_id,
        'buyer',
        'message',
        'New Message from Vendor',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
    
    IF conv.rider_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.rider_id,
        'rider',
        'message',
        'New Message from Vendor',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
  ELSIF NEW.sender_id = conv.rider_id THEN
    -- Rider sent message - notify buyer and vendor
    IF conv.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.buyer_id,
        'buyer',
        'message',
        'New Message from Rider',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
    
    IF conv.vendor_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, user_type, type, title, message, metadata
      ) VALUES (
        conv.vendor_id,
        'vendor',
        'message',
        'New Message from Rider',
        concat(sender_name, ': ', substring(NEW.message, 1, 50)),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'sender_name', sender_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Verify all triggers are now installed
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'deliveries', 'messages')
ORDER BY event_object_table, trigger_name;