import { mockCases } from "../mockData";

export function CasesManagement() {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6">Challan Management</h2>
      
      <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-lg flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#334155]/50 text-gray-300 text-sm font-medium border-b border-slate-700">
                <th className="py-4 px-6 font-semibold">ID</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Vehicle</th>
                <th className="py-4 px-6 font-semibold">Violation</th>
                <th className="py-4 px-6 font-semibold">Fine</th>
                <th className="py-4 px-6 font-semibold">Officer</th>
                <th className="py-4 px-6 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {mockCases.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors text-sm">
                  <td className="py-4 px-6 text-gray-300">CH10{idx + 1}</td>
                  <td className="py-4 px-6 text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-gray-300">{c.vehicle_number}</td>
                  <td className="py-4 px-6 text-gray-300">{c.reason}</td>
                  <td className="py-4 px-6 text-gray-300">₹{c.fine}</td>
                  <td className="py-4 px-6 text-gray-400">{c.user_name}</td>
                  <td className="py-4 px-6">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.status === 'Paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Add a few more rows to fill it out similar to screenshot */}
              {[
                { id: "106", date: "2026-05-01", v: "DL02XY9999", r: "Signal Jump", f: 1000, o: "Ramesh", s: "Pending" },
                { id: "107", date: "2026-05-01", v: "MH01AB1111", r: "Speeding", f: 2000, o: "Amit Kumar", s: "Paid" },
                { id: "108", date: "2026-04-30", v: "KA05CD2222", r: "No Helmet", f: 500, o: "Rahul Singh", s: "Pending" },
              ].map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors text-sm">
                  <td className="py-4 px-6 text-gray-300">CH{c.id}</td>
                  <td className="py-4 px-6 text-gray-400">
                    {new Date(c.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-gray-300">{c.v}</td>
                  <td className="py-4 px-6 text-gray-300">{c.r}</td>
                  <td className="py-4 px-6 text-gray-300">₹{c.f}</td>
                  <td className="py-4 px-6 text-gray-400">{c.o}</td>
                  <td className="py-4 px-6">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.s === 'Paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}
                    >
                      {c.s}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
