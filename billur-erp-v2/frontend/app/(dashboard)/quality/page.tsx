"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Quality Check</h1>
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            Bu sahifa Bosqich 2-3'da yaratiladi.<br />
            <span className="text-xs">Backend allaqachon tayyor — UI integratsiya qoldi.</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
