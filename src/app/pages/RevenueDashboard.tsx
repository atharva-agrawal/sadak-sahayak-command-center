export function RevenueDashboard() {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6">Revenue Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-slate-700/50 flex flex-col justify-center">
          <h3 className="text-gray-300 font-medium mb-3 text-lg">Daily Revenue</h3>
          <p className="text-3xl font-semibold text-white">₹2.1L</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-slate-700/50 flex flex-col justify-center">
          <h3 className="text-gray-300 font-medium mb-3 text-lg">Monthly Revenue</h3>
          <p className="text-3xl font-semibold text-white">₹58.0L</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-slate-700/50 flex flex-col justify-center">
          <h3 className="text-gray-300 font-medium mb-3 text-lg">Pending Payments</h3>
          <p className="text-3xl font-semibold text-orange-400">₹8.0L</p>
        </div>
      </div>
      
      {/* Some extra charts could be here to make it analytical as requested by prompt */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-slate-700/50 min-h-[300px] flex items-center justify-center">
           <p className="text-gray-500">More detailed revenue analytics can be implemented here.</p>
        </div>
      </div>
    </div>
  );
}
