import React, { useMemo, useState } from 'react';

interface BatchItem {
  id: number;
  location: string;
  batchNumber: string;
  batchStatus: 'active' | 'completed' | 'dropped';
}

interface FunderItem {
  name: string;
  code?: string;
}

interface AllocationItem {
  batchId: number;
  funderName: string;
  allocatedAt?: string;
}

interface FunderAllocationPageProps {
  batches: BatchItem[];
  funders: FunderItem[];
  allocations: AllocationItem[];
  onUpdate: (data: AllocationItem[]) => void;
  themeColor?: string;
}

export const FunderAllocationPage: React.FC<FunderAllocationPageProps> = ({
  batches,
  funders,
  allocations,
  onUpdate,
  themeColor = 'brand-600'
}) => {
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());
  const [bulkFunder, setBulkFunder] = useState('');
  const [draftFunderByBatch, setDraftFunderByBatch] = useState<Record<number, string>>({});

  const locationOptions = useMemo(() => {
    return Array.from(new Set((batches || []).map((b) => b.location).filter(Boolean)));
  }, [batches]);

  const funderOptions = useMemo(() => {
    return Array.from(new Set((funders || []).map((f) => f.name).filter(Boolean)));
  }, [funders]);

  const allocationMap = useMemo(() => {
    const map = new Map<number, AllocationItem>();
    (allocations || []).forEach((item) => map.set(item.batchId, item));
    return map;
  }, [allocations]);

  const filteredBatches = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (batches || []).filter((batch) => {
      const matchesLocation = selectedLocation === 'ALL' || batch.location === selectedLocation;
      const matchesQuery =
        query === '' ||
        batch.location.toLowerCase().includes(query) ||
        batch.batchNumber.toLowerCase().includes(query) ||
        batch.batchStatus.toLowerCase().includes(query);

      return matchesLocation && matchesQuery;
    });
  }, [batches, selectedLocation, searchText]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredBatches.length === 0) return false;
    return filteredBatches.every((batch) => selectedBatchIds.has(batch.id));
  }, [filteredBatches, selectedBatchIds]);

  const toggleSelectAllFiltered = () => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredBatches.forEach((batch) => next.delete(batch.id));
      } else {
        filteredBatches.forEach((batch) => next.add(batch.id));
      }
      return next;
    });
  };

  const toggleSingleBatch = (batchId: number) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  const setDraftFunder = (batchId: number, value: string) => {
    setDraftFunderByBatch((prev) => ({ ...prev, [batchId]: value }));
  };

  const upsertAllocation = (batchId: number, funderName: string) => {
    const nextRow: AllocationItem = {
      batchId,
      funderName,
      allocatedAt: new Date().toISOString()
    };

    const existingIndex = (allocations || []).findIndex((item) => item.batchId === batchId);
    const nextData = existingIndex === -1
      ? [...(allocations || []), nextRow]
      : (allocations || []).map((item) => (item.batchId === batchId ? nextRow : item));

    onUpdate(nextData);
  };

  const allocateSingle = (batchId: number) => {
    const draft = (draftFunderByBatch[batchId] || '').trim();
    if (!draft) {
      window.alert('Please select a funder.');
      return;
    }
    upsertAllocation(batchId, draft);
  };

  const allocateSelected = () => {
    const funderName = bulkFunder.trim();
    if (!funderName) {
      window.alert('Please select a funder for bulk allocation.');
      return;
    }

    const batchIds = Array.from(selectedBatchIds) as number[];
    if (batchIds.length === 0) {
      window.alert('Please select at least one batch.');
      return;
    }

    const now = new Date().toISOString();
    const nextMap = new Map<number, AllocationItem>();
    (allocations || []).forEach((item) => nextMap.set(item.batchId, item));
    batchIds.forEach((batchId) => {
      nextMap.set(batchId, { batchId, funderName, allocatedAt: now });
    });

    onUpdate(Array.from(nextMap.values()));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Funder Allocation</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Allocate batches to funders from Funder Master</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by location, batch number or status"
              className="w-full max-w-md px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 items-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={toggleSelectAllFiltered}
                className="rounded border-slate-300"
              />
              Select All (Filtered)
            </label>
            <select
              value={bulkFunder}
              onChange={(e) => setBulkFunder(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Select funder for selected batches</option>
              {funderOptions.map((funder) => (
                <option key={funder} value={funder}>{funder}</option>
              ))}
            </select>
            <button
              onClick={allocateSelected}
              className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}
            >
              Allocate Selected
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Batch Status</th>
                  <th className="px-4 py-3">Select Funder</th>
                  <th className="px-4 py-3">Allocated Funder</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No batches found for allocation.
                    </td>
                  </tr>
                )}
                {filteredBatches.map((batch) => {
                  const allocated = allocationMap.get(batch.id);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.has(batch.id)}
                          onChange={() => toggleSingleBatch(batch.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{batch.location}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{batch.batchNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 capitalize">{batch.batchStatus}</td>
                      <td className="px-4 py-3">
                        <select
                          value={draftFunderByBatch[batch.id] ?? allocated?.funderName ?? ''}
                          onChange={(e) => setDraftFunder(batch.id, e.target.value)}
                          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="">Select funder</option>
                          {funderOptions.map((funder) => (
                            <option key={funder} value={funder}>{funder}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{allocated?.funderName || '--'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => allocateSingle(batch.id)}
                          className={`px-3 py-1.5 rounded-lg bg-${themeColor} text-white text-xs font-extrabold hover:opacity-90 transition`}
                        >
                          Allocate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
