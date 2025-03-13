import {
  usePreferredWalletAddress,
  useUSDCBalance,
} from '@/queries/EthereumQuery';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { UsdcSVG } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';
import { Drip, Label1, Label2, Mono } from '../ui/typography';
import { useToast } from '@/lib/hooks/use-toast';

interface TokenBalanceProps {
  icon: React.ReactNode;
  name: string;
  balance: string;
  value?: string;
  isLoading?: boolean;
}

const TokenBalance = ({
  icon,
  name,
  balance,
  value,
  isLoading,
}: TokenBalanceProps) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <Label1>{name}</Label1>
          {value && <Label2 className="text-gray-500">{value}</Label2>}
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <Label1>{balance}</Label1>
        )}
      </div>
    </div>
  );
};

const WalletAddress = () => {
  const walletAddress = usePreferredWalletAddress();
  const { toast } = useToast();

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: 'Address Copied ✅',
      duration: 2000,
    });
  };

  if (!walletAddress) return <Skeleton className="w-24 h-4" />;

  return (
    <button onClick={() => handleCopy(walletAddress)}>
      <Mono className="text-sm text-gray-700">
        {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
      </Mono>
    </button>
  );
};

export const WalletCard = () => {
  const { data: usdcBalance, isLoading: isUsdcLoading } = useUSDCBalance({
    pollingInterval: 10000,
  });

  return (
    <Card className="w-full max-w-md bg-drip-yellow opacity-90 rounded-3xl shadow-xl aspect-[3.370/2.125] flex flex-col">
      <CardHeader className="py-4">
        <CardTitle>
          <Drip className="text-2xl">Drip Card</Drip>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between flex-1">
        <TokenBalance
          icon={<UsdcSVG className="h-6 w-6" />}
          name="USDC"
          balance={usdcBalance ? usdcBalance.prettyFormat() : '0.00'}
          value="Available Balance"
          isLoading={isUsdcLoading}
        />
      </CardContent>
      <CardFooter>
        <WalletAddress />
      </CardFooter>
    </Card>
  );
};
