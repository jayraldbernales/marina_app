import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck } from "lucide-react";
import VendorApplications from "./VendorApplications";
import RiderApplications from "./RiderApplications";

type ApplicationType = "vendors" | "riders";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationType>("vendors");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Manage vendor and rider applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ApplicationType)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendors">Vendor Applications</TabsTrigger>
          <TabsTrigger value="riders">Rider Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <VendorApplications />
        </TabsContent>

        <TabsContent value="riders">
          <RiderApplications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
