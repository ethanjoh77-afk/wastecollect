import {
  Users,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Recycle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bell,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import {
  StatCard,
  QuickAction,
  AreaChartCard,
  BarChartCard,
  PieChartCard,
  ActivityFeed,
} from '../components/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common';
import { useAuth } from '../hooks/useAuth';

const wasteTrendData = [
  { name: 'Jan', value: 1200 },
  { name: 'Feb', value: 1400 },
  { name: 'Mar', value: 1350 },
  { name: 'Apr', value: 1600 },
  { name: 'May', value: 1800 },
  { name: 'Jun', value: 2100 },
];

const wasteTypeData = [
  { name: 'Household', value: 45 },
  { name: 'Organic', value: 25 },
  { name: 'Plastic', value: 15 },
  { name: 'Paper', value: 10 },
  { name: 'Other', value: 5 },
];

const zonePerformanceData = [
  { name: 'Zone A', value: 95 },
  { name: 'Zone B', value: 88 },
  { name: 'Zone C', value: 72 },
  { name: 'Zone D', value: 91 },
  { name: 'Zone E', value: 85 },
];

const upcomingSchedules = [
  { id: '1', zone: 'Zone A', day: 'Monday', time: '08:00 - 12:00', driver: 'John Driver' },
  { id: '2', zone: 'Zone B', day: 'Tuesday', time: '08:00 - 12:00', driver: 'Jane Driver' },
  { id: '3', zone: 'Zone C', day: 'Wednesday', time: '13:00 - 17:00', driver: 'Mike Driver' },
];

const alerts = [
  { id: '1', type: 'warning', message: 'Smart bin SB-045 at 95% capacity', location: 'Main Street' },
  { id: '2', type: 'error', message: 'Vehicle V-012 requires maintenance', location: 'Depot' },
  { id: '3', type: 'info', message: 'Route optimization completed for Zone A', location: '' },
];

export function DashboardPage() {
  const { user } = useAuth();

  const renderRoleBasedContent = () => {
    switch (user?.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'municipality_admin':
        return <MunicipalityAdminDashboard />;
      case 'company_admin':
        return <CompanyAdminDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'citizen':
        return <CitizenDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {renderRoleBasedContent()}
      </div>
    </DashboardLayout>
  );
}

function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Overview of system-wide operations and performance
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">+12.5% this month</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Citizens"
          value="12,847"
          change={8.2}
          icon={Users}
          iconColor="bg-primary-500"
          trend="up"
        />
        <StatCard
          title="Active Drivers"
          value="156"
          change={-2.1}
          icon={Truck}
          iconColor="bg-secondary-500"
          trend="down"
        />
        <StatCard
          title="Vehicles Online"
          value="42"
          change={5}
          icon={MapPin}
          iconColor="bg-accent-500"
          trend="up"
        />
        <StatCard
          title="Revenue"
          value="TZS 2.4M"
          change={15.3}
          icon={DollarSign}
          iconColor="bg-success-500"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AreaChartCard title="Waste Collection Trend (tons)" data={wasteTrendData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PieChartCard title="Waste Type Distribution" data={wasteTypeData} />
            <BarChartCard title="Zone Performance (%)" data={zonePerformanceData} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning-500" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-secondary-100 dark:divide-slate-700">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="px-6 py-4 hover:bg-secondary-50 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          alert.type === 'error'
                            ? 'bg-error-500'
                            : alert.type === 'warning'
                            ? 'bg-warning-500'
                            : 'bg-primary-500'
                        }`}
                      />
                      <div>
                        <p className="text-sm text-secondary-900 dark:text-white">
                          {alert.message}
                        </p>
                        {alert.location && (
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {alert.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ActivityFeed />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Manage Users"
          description="Add, edit, or remove users"
          icon={Users}
          color="bg-primary-500"
        />
        <QuickAction
          title="Add Municipality"
          description="Register new municipality"
          icon={MapPin}
          color="bg-secondary-500"
        />
        <QuickAction
          title="View Reports"
          description="Access system reports"
          icon={FileText}
          color="bg-accent-500"
        />
        <QuickAction
          title="Recycling Data"
          description="View recycling metrics"
          icon={Recycle}
          color="bg-success-500"
        />
      </div>
    </div>
  );
}

function MunicipalityAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
            Municipality Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Manage wards, schedules, and collection operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Total Wards" value="24" icon={MapPin} iconColor="bg-primary-500" />
        <StatCard title="Pending Reports" value="18" icon={FileText} iconColor="bg-warning-500" />
        <StatCard title="Collections Today" value="45" icon={Truck} iconColor="bg-success-500" />
        <StatCard title="Active Drivers" value="32" icon={Users} iconColor="bg-secondary-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary-100 dark:divide-slate-700">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-secondary-50 dark:hover:bg-slate-700/50"
                >
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white">
                      {schedule.zone}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {schedule.day} &middot; {schedule.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {schedule.driver}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <BarChartCard title="Weekly Collection Performance" data={zonePerformanceData} />
      </div>

      <ActivityFeed />
    </div>
  );
}

function CompanyAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
            Company Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Manage drivers, vehicles, and routes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Total Drivers" value="48" icon={Users} iconColor="bg-primary-500" />
        <StatCard title="Vehicles" value="25" icon={Truck} iconColor="bg-secondary-500" />
        <StatCard title="Active Routes" value="12" icon={MapPin} iconColor="bg-success-500" />
        <StatCard title="Completed Today" value="8" icon={FileText} iconColor="bg-accent-500" />
      </div>

      <AreaChartCard title="Collections This Week" data={wasteTrendData} />

      <ActivityFeed />
    </div>
  );
}

function DriverDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
            Driver Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            View your assigned routes and tasks for today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <StatCard title="Today's Stops" value="15" icon={MapPin} iconColor="bg-primary-500" />
        <StatCard title="Completed" value="8" icon={FileText} iconColor="bg-success-500" />
        <StatCard title="Remaining" value="7" icon={Truck} iconColor="bg-warning-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <div>
              <p className="font-semibold text-primary-700 dark:text-primary-300">Route #12</p>
              <p className="text-sm text-primary-600 dark:text-primary-400">Zone A - Main Street Corridor</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">53%</p>
              <p className="text-xs text-primary-600 dark:text-primary-400">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Route Stops
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-secondary-100 dark:divide-slate-700">
            {[
              { id: '1', address: '123 Main Street', status: 'completed' },
              { id: '2', address: '456 Oak Avenue', status: 'completed' },
              { id: '3', address: '789 Pine Road', status: 'in_progress' },
              { id: '4', address: '101 Elm Street', status: 'pending' },
              { id: '5', address: '202 Cedar Lane', status: 'pending' },
            ].map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-secondary-50 dark:hover:bg-slate-700/50"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stop.status === 'completed'
                      ? 'bg-success-500 text-white'
                      : stop.status === 'in_progress'
                      ? 'bg-primary-500 text-white'
                      : 'bg-secondary-200 dark:bg-slate-700 text-secondary-600 dark:text-secondary-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    {stop.address}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                    {stop.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CitizenDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Track collections, report issues, and manage your account
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Eco Score" value="850" icon={Recycle} iconColor="bg-success-500" />
        <StatCard title="Reward Points" value="1,250" icon={TrendingUp} iconColor="bg-primary-500" />
        <StatCard title="Next Collection" value="Tomorrow" icon={Calendar} iconColor="bg-secondary-500" />
        <StatCard title="Active Reports" value="2" icon={FileText} iconColor="bg-warning-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Collection Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary-100 dark:divide-slate-700">
              {[
                { day: 'Monday', waste: 'Household Waste', time: '08:00 - 12:00' },
                { day: 'Wednesday', waste: 'Organic Waste', time: '08:00 - 12:00' },
                { day: 'Friday', waste: 'Recyclables', time: '13:00 - 17:00' },
              ].map((schedule, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-secondary-900 dark:text-white">{schedule.day}</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{schedule.time}</p>
                  </div>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    {schedule.waste}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Report Issue"
          description="Report illegal dumping, overflow"
          icon={AlertTriangle}
          color="bg-warning-500"
        />
        <QuickAction
          title="Request Pickup"
          description="Schedule special collection"
          icon={Truck}
          color="bg-primary-500"
        />
        <QuickAction
          title="Track Truck"
          description="See live vehicle location"
          icon={MapPin}
          color="bg-secondary-500"
        />
        <QuickAction
          title="Pay Fees"
          description="Make a payment"
          icon={DollarSign}
          color="bg-success-500"
        />
      </div>
    </div>
  );
}
export default DashboardPage;
