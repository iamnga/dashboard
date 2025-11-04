import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency, formatNumber, formatPercentage, formatDuration } from '@/lib/utils';
import type { EnhancedKPICard as EnhancedKPICardType } from '../types';

interface Props {
  data: EnhancedKPICardType;
  onClick?: () => void;
}

export function EnhancedKPICard({ data, onClick }: Props) {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percentage':
        return formatPercentage(value);
      case 'duration':
        return formatDuration(value);
      default:
        return String(value);
    }
  };

  const trendColor = data.delta.trend === 'up' ? 'text-green-600' : data.delta.trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = data.delta.trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
        {data.tooltip && (
          <div className="relative group/tooltip">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute right-0 top-6 hidden group-hover/tooltip:block z-10 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border">
              {data.tooltip}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(data.value, data.format)}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            {data.delta.trend !== 'neutral' && <TrendIcon className="h-4 w-4" />}
            <span className="font-medium">
              {data.delta.value >= 0 ? '+' : ''}
              {formatNumber(data.delta.value, 1)}%
            </span>
            <span className="text-muted-foreground text-xs">
              {data.delta.period}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        {data.sparkline.length > 0 && (
          <div className="mt-3 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sparkline}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                  className={trendColor}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
