import { Bell, AlertTriangle, CheckCircle, Clock, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { formatTime } from '../../lib/utils';

interface Activity {
  id: string;
  type: 'collection' | 'report' | 'payment' | 'alert' | 'success';
  title: string;
  description: string;
  timestamp: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'collection',
    title: 'Route #12 Completed',
    description: 'Driver John finished Zone A collection',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'report',
    title: 'New Report Submitted',
    description: 'Illegal dumping reported at Main Street',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    description: 'TZS 50,000 from citizen #C-234',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '4',
    type: 'alert',
    title: 'Bin Overflow Alert',
    description: 'Smart bin SB-045 is at 95% capacity',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '5',
    type: 'success',
    title: 'Route Optimized',
    description: 'AI reduced Route #8 by 12km',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const typeConfig = {
  collection: { icon: Truck, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  report: { icon: Bell, color: 'text-secondary-500', bg: 'bg-secondary-100 dark:bg-secondary-700' },
  payment: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-100 dark:bg-success-900/30' },
  alert: { icon: AlertTriangle, color: 'text-warning-500', bg: 'bg-warning-100 dark:bg-warning-900/30' },
  success: { icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-100 dark:bg-success-900/30' },
};

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          View all
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-secondary-100 dark:divide-slate-700">
          {activities.map((activity) => {
            const config = typeConfig[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-secondary-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-secondary-500 dark:text-secondary-500 whitespace-nowrap">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
