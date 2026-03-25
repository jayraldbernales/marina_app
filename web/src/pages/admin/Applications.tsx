import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorApplications from "./VendorApplications";
import RiderApplications from "./RiderApplications";

type ApplicationType = "vendors" | "riders";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationType>("vendors");

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ApplicationType)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendors">Vendor Applications</TabsTrigger>
          <TabsTrigger value="riders">Rider Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="mt-6">
          <VendorApplications />
        </TabsContent>

        <TabsContent value="riders" className="mt-6">
          <RiderApplications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
