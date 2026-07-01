import { WalletGate } from "@/components/app/wallet-gate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <WalletGate>
        <div className="flex min-h-0 flex-1">{children}</div>
      </WalletGate>
    </div>
  );
}
