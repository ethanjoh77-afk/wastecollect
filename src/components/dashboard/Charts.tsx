import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

function ChartCard({ title, children, className, action }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface AreaChartData {
  name: string;
  value: number;
}

export function AreaChartCard({
  title,
  data,
  dataKey = 'value',
  className,
}: {
  title: string;
  data: AreaChartData[];
  dataKey?: string;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

export function BarChartCard({
  title,
  data,
  dataKey = 'value',
  className,
}: {
  title: string;
  data: BarChartData[];
  dataKey?: string;
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Bar dataKey={dataKey} fill="#10b981" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PieChartData {
  name: string;
  value: number;
}

export function PieChartCard({
  title,
  data,
  className,
}: {
  title: string;
  data: PieChartData[];
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

export function LineChartCard({
  title,
  data,
  lines,
  className,
}: {
  title: string;
  data: LineChartData[];
  lines: { dataKey: string; stroke: string; name: string }[];
  className?: string;
}) {
  return (
    <ChartCard title={title} className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export { ChartCard };
