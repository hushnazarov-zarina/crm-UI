"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, Users, Package, AlertTriangle, ShoppingCart, Factory,
  CheckCircle, Clock, TrendingUp, Activity, Loader2,
} from "lucide-react";

interface Overview {
  orders: { active: number; problem: number; completed: number; total: number };
  clients: number;
  workers: number;
  open_discrepancies: number;
  today_events: { stage: string; qty: number }[];
}

interface StageProgress {
  stage_id: string;
  stage_name: string;
  sort_order: number;
  qty: number;
}

interface RecentEvent {
  id: number;
  occurred_at: string;
  to_stage: string;
  qty: number;
  worker_name: string | null;
  model_code: string | null;
  color_code: string | null;
  size_code: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  cutting: 'Bichish', printing: 'Print', sewing: 'Tikuv',
  quality: 'QC', ironing: 'Dazmol', packing: 'Qadoq',
  boxing: 'Box', shipped: 'Yuborildi',
};

export default function DashboardPage() {
  const overview = useQuery<Overview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/api/dashboard/overview'),
    refetchInterval: 30_000,
  });

  const stages = useQuery<StageProgress[]>({
    queryKey: ['dashboard', 'stages'],
    queryFn: () => api.get('/api/dashboard/orders-by-stage'),
    refetchInterval: 30_000,
  });

  const events = useQuery<RecentEvent[]>({
    queryKey: ['dashboard', 'events'],
    queryFn: () => api.get('/api/dashboard/recent-events'),
    refetchInterval: 5_000,
  });

  if (overview.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const o = overview.data;
  const todayTotal = o?.today_events.reduce((s, e) => s + e.qty, 0) || 0;
  const maxStage = Math.max(1, ...(stages.data?.map(s => s.qty) || [1]));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Production tizimning umumiy holati
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faol zakazlar</p>
                <p className="text-3xl font-bold">{o?.orders.active || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Jami: {o?.orders.total || 0}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={o?.orders.problem ? 'border-amber-500/50 bg-amber-50/30' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Muammoli zakazlar</p>
                <p className={`text-3xl font-bold ${o?.orders.problem ? 'text-amber-600' : ''}`}>
                  {o?.orders.problem || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {o?.open_discrepancies || 0} ochiq discrepancy
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${o?.orders.problem ? 'text-amber-600' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Klientlar</p>
                <p className="text-3xl font-bold">{o?.clients || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">aktiv</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ishchilar</p>
                <p className="text-3xl font-bold">{o?.workers || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">aktiv</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" /> Bosqichlar bo'yicha holat
            </CardTitle>
            <CardDescription>
              Faol zakazlar bo'yicha hozirgi production holati
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stages.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            ) : !stages.data?.length ? (
              <p className="text-center text-muted-foreground py-8">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-4">
                {stages.data.map(s => (
                  <div key={s.stage_id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{s.stage_name}</span>
                      <span className="text-sm text-muted-foreground font-mono">{s.qty}</span>
                    </div>
                    <Progress value={(s.qty / maxStage) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Bugungi production
            </CardTitle>
            <CardDescription>
              Bugun bajarilgan ishlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold">{todayTotal}</p>
              <p className="text-xs text-muted-foreground">jami dona</p>
            </div>
            <div className="space-y-2">
              {o?.today_events.length ? o.today_events.map(e => (
                <div key={e.stage} className="flex justify-between items-center text-sm">
                  <Badge variant="outline">
                    {STAGE_LABELS[e.stage] || e.stage}
                  </Badge>
                  <span className="font-mono font-semibold">{e.qty}</span>
                </div>
              )) : (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Bugun events yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Live feed
          </CardTitle>
          <CardDescription>
            So'nggi production events (har 5 soniyada yangilanadi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          ) : !events.data?.length ? (
            <p className="text-center text-muted-foreground py-8">Events yo'q</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.data.slice(0, 20).map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono w-16">
                      {new Date(e.occurred_at).toLocaleTimeString('uz-UZ', { hour12: false })}
                    </span>
                    <Badge variant="outline">
                      {STAGE_LABELS[e.to_stage] || e.to_stage}
                    </Badge>
                    <span className="text-xs">
                      {e.model_code && <span className="font-mono">{e.model_code}</span>}
                      {e.color_code && <span className="text-muted-foreground"> · {e.color_code}</span>}
                      {e.size_code && <span className="text-muted-foreground"> · {e.size_code}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">{e.qty}</span>
                    {e.worker_name && (
                      <span className="text-xs text-muted-foreground">{e.worker_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
