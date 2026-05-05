"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { QrScanner } from "@/components/qr/qr-scanner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QrCode, Scan, CheckCircle, XCircle, AlertTriangle, User,
  RefreshCw, Search, History, Zap, Loader2, ShieldAlert,
} from "lucide-react";

interface Stage { id: string; name_uz: string; sort_order: number; }

interface BadgeInfo {
  worker_id: string;
  employee_code: string;
  full_name: string;
  position: string | null;
  default_stage: string | null;
  default_stage_name: string | null;
}

interface ScanRow {
  id: number;
  scanned_at: string;
  stage: string | null;
  qty: number | null;
  scan_type: string;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  approved_by: string | null;
  worker_id: string;
  worker_name: string | null;
  employee_code: string | null;
  stage_name: string | null;
  order_item_id: string | null;
  order_code: string | null;
  order_type: string | null;
}

export default function ScanningPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  // Authenticated worker (after badge scan/lookup)
  const [badge, setBadge] = useState<BadgeInfo | null>(null);

  // Scan inputs
  const [scanInput, setScanInput] = useState("");
  const [stageId, setStageId] = useState<string>("");
  const [orderItemId, setOrderItemId] = useState("");
  const [qty, setQty] = useState("");

  // Scanner pause flag — blocks duplicate emits while we process a scan
  const [busy, setBusy] = useState(false);
  // Tracks where the next QR result should go: 'badge' or 'order_item'
  const [scanTarget, setScanTarget] = useState<'badge' | 'order_item'>('badge');

  const { data: stages } = useQuery<Stage[]>({
    queryKey: ['stages'],
    queryFn: () => api.get('/api/master/stages'),
  });

  const { data: scans, isLoading: scansLoading } = useQuery<ScanRow[]>({
    queryKey: ['qr-scans'],
    queryFn: () => api.get('/api/qr/scans?limit=50'),
    refetchInterval: 5000,
  });

  // ── Badge lookup (no scan recorded) ─────────────────────────────────────
  const lookupMut = useMutation({
    mutationFn: (token: string) => api.post<BadgeInfo>('/api/qr/lookup', { token }),
    onSuccess: (info) => {
      setBadge(info);
      if (info.default_stage) setStageId(info.default_stage);
      toast.success(`Xush kelibsiz, ${info.full_name}!`);
    },
    onError: (e: any) => toast.error(`QR yaroqsiz: ${e.message}`),
  });

  // ── Stage advance scan ──────────────────────────────────────────────────
  const tokenForScanRef = useRef<string | null>(null);
  const scanMut = useMutation({
    mutationFn: (vars: { token: string; stage: string; order_item_id: string; qty: number }) =>
      api.post('/api/qr/scan', {
        token: vars.token,
        stage: vars.stage,
        order_item_id: vars.order_item_id,
        qty: vars.qty,
        scan_type: 'stage_advance',
      }),
    onSuccess: (res: any) => {
      if (res.is_suspicious) {
        toast.warning(`Shubhali scan! ${res.suspicious_reason}. Supervisor tasdiqlashi kerak.`);
      } else {
        toast.success(`✓ ${res.qty_after}/${res.ordered_qty} ta yozildi`);
      }
      setOrderItemId('');
      setQty('');
      qc.invalidateQueries({ queryKey: ['qr-scans'] });
    },
    onError: (e: any) => toast.error(`Xato: ${e.message}`),
  });

  // ── Approve suspicious scan ─────────────────────────────────────────────
  const approveMut = useMutation({
    mutationFn: (id: number) => api.post(`/api/qr/scans/${id}/approve`),
    onSuccess: () => {
      toast.success('Tasdiqlandi');
      qc.invalidateQueries({ queryKey: ['qr-scans'] });
    },
    onError: (e: any) => toast.error(`Xato: ${e.message}`),
  });

  // ── QR scanner result handler ───────────────────────────────────────────
  const handleQrResult = async (text: string) => {
    setBusy(true);
    try {
      if (scanTarget === 'badge' || !badge) {
        // Try as a badge token
        await lookupMut.mutateAsync(text);
        tokenForScanRef.current = text;
        setScanTarget('order_item');
      } else {
        // Treat as an order_item identifier (UUID typed into a QR or BOX-... code)
        setOrderItemId(text);
        toast.info(`Mahsulot QR: ${text.slice(0, 16)}...`);
      }
    } catch { /* error handled by mutation */ }
    finally {
      setTimeout(() => setBusy(false), 800);
    }
  };

  const handleManualScan = async () => {
    if (!scanInput.trim()) return;
    await handleQrResult(scanInput.trim());
    setScanInput('');
  };

  const handleSubmitStageAdvance = () => {
    if (!badge || !tokenForScanRef.current) return;
    if (!stageId)      return toast.error('Bosqich tanlang');
    if (!orderItemId)  return toast.error('Mahsulot ID kerak');
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 1) return toast.error("Soni 1 dan katta bo'lishi kerak");

    scanMut.mutate({
      token: tokenForScanRef.current,
      stage: stageId,
      order_item_id: orderItemId,
      qty: n,
    });
  };

  const handleResetBadge = () => {
    setBadge(null);
    tokenForScanRef.current = null;
    setOrderItemId('');
    setQty('');
    setScanTarget('badge');
  };

  // Stats
  const total = scans?.length ?? 0;
  const suspicious = scans?.filter(s => s.is_suspicious && !s.approved_by).length ?? 0;
  const approved = scans?.filter(s => !s.is_suspicious || s.approved_by).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Scanning</h1>
          <p className="text-muted-foreground">
            Ishchi badge'i va mahsulotni scan qiling, production event yozing
          </p>
        </div>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['qr-scans'] })}>
          <RefreshCw className="mr-2 h-4 w-4" /> Yangilash
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami scans</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasdiqlangan</p>
                <p className="text-2xl font-bold text-green-600">{approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shubhali (kutilmoqda)</p>
                <p className="text-2xl font-bold text-amber-600">{suspicious}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" /> Scanner
            </CardTitle>
            <CardDescription>
              {!badge
                ? "1-qadam: ishchi badge'ini scan qiling"
                : "2-qadam: mahsulot QR'ini scan qiling yoki ID kiriting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <QrScanner onResult={handleQrResult} ready={!busy} />

            <div className="space-y-2">
              <Label>Yoki qo'lda kirgizish</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={badge ? "Mahsulot ID..." : "Token yoki worker code..."}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <Button onClick={handleManualScan} disabled={!scanInput.trim()}>
                  <Zap className="mr-2 h-4 w-4" /> Yuborish
                </Button>
              </div>
            </div>

            {badge && (
              <Button variant="ghost" onClick={handleResetBadge} className="w-full">
                ↺ Boshqa ishchi (badge'ni tozalash)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Authentifikatsiya & ish
            </CardTitle>
            <CardDescription>
              {badge ? "Ishchi tasdiqlandi" : "Badge'ni scan qilish kutilmoqda"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!badge ? (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Birinchi ishchi badge'ini scan qiling. So'ng siz mahsulotlarning bosqichini
                  ilgariga harakatlantira olasiz.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-600 text-white">
                      {badge.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{badge.full_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {badge.employee_code}
                    </div>
                    {badge.position && (
                      <div className="text-xs text-muted-foreground">{badge.position}</div>
                    )}
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Bosqich</Label>
                    <Select value={stageId} onValueChange={setStageId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bosqichni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name_uz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {badge.default_stage && stageId !== badge.default_stage && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Doimiy bosqichdan farqli — shubhali deb belgilanadi
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Mahsulot ID (order_item)</Label>
                    <Input
                      value={orderItemId}
                      onChange={(e) => setOrderItemId(e.target.value)}
                      placeholder="UUID..."
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>Soni</Label>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="50"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSubmitStageAdvance}
                    disabled={!stageId || !orderItemId || !qty || scanMut.isPending}
                  >
                    {scanMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Production event yozish
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Scan tarixi
          </CardTitle>
          <CardDescription>So'nggi 50 ta scan</CardDescription>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto animate-spin" />
            </div>
          ) : !scans?.length ? (
            <div className="text-center py-8 text-muted-foreground">Scan yo'q</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaqt</TableHead>
                  <TableHead>Ishchi</TableHead>
                  <TableHead>Bosqich</TableHead>
                  <TableHead>Zakaz</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono whitespace-nowrap">
                      {new Date(s.scanned_at).toLocaleTimeString('uz-UZ', { hour12: false })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{s.worker_name || '—'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {s.employee_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.stage_name && (
                        <Badge variant="outline">{s.stage_name}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{s.order_code || '—'}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{s.qty || '—'}</TableCell>
                    <TableCell>
                      {s.is_suspicious && !s.approved_by ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Shubhali
                        </Badge>
                      ) : s.approved_by ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Tasdiqlangan
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.is_suspicious && !s.approved_by && hasPermission('qr.approve') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMut.mutate(s.id)}
                          disabled={approveMut.isPending}
                        >
                          Tasdiqlash
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
