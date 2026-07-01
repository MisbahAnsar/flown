import { WalletGate } from "@/components/app/wallet-gate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <WalletGate>
        <div className="flex min-h-0 flex-1">{children}</div>
      </WalletGate>
    </div>
  );
}
