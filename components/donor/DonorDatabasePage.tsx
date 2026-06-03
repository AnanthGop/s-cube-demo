import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CitizenStatus,
  DonorFormData,
  DonorRecord,
  DonorType,
  FundTypeItem,
  KycDocument,
  ModeOfReceipt,
} from "./donorRules";
import {
  DONOR_ADDRESS_FIELD_GRID_CLASS,
  DONOR_TYPE_OPTIONS,
  MODE_OF_RECEIPT_OPTIONS,
  getAvailableKycDocuments,
  getDefaultKycDocument,
  getDonorAddAutoOpenDecision,
  getEligibleFundTypes,
  getInitialDonorFormData,
  getNextDonorSerial,
  sanitizeDonorFormData,
  selectDefaultFundType,
  shouldRequireKycAndIdNumber,
  shouldShowCinNumberField,
  shouldShowContactPersonFields,
  shouldShowVerifyPanButton,
  shouldUseBlankKycDocument,
  upsertDonorRecord,
} from "./donorRules";

interface DonorDatabasePageProps {
  data: DonorRecord[];
  fundTypes: FundTypeItem[];
  onUpdate: (data: DonorRecord[]) => void;
  themeColor?: string;
  autoOpenAddToken?: number;
  onAutoOpenAddConsumed?: (nextToken: number) => void;
}

type FormMode = "add" | "edit";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const formatModeOfReceipt = (mode: string) => mode || "--";

export const DonorDatabasePage: React.FC<DonorDatabasePageProps> = ({
  data,
  fundTypes,
  onUpdate,
  themeColor = "brand-600",
  autoOpenAddToken,
  onAutoOpenAddConsumed,
}) => {
  const [searchText, setSearchText] = useState("");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DonorFormData>(() =>
    getInitialDonorFormData(fundTypes),
  );
  const [viewingDonor, setViewingDonor] = useState<DonorRecord | null>(null);

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return data || [];

    return (data || []).filter((item) =>
      [
        item.donorName,
        item.donorId,
        item.donorType,
        item.citizenStatus,
        item.fundType,
        item.kycDocument,
        item.idNumber,
        item.contactNumber,
        item.emailId,
        item.cinNumber,
        item.modeOfReceipt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, searchText]);

  const eligibleFundTypes = useMemo(
    () => getEligibleFundTypes(form.citizenStatus, fundTypes),
    [form.citizenStatus, fundTypes],
  );

  const kycOptions = useMemo(
    () => getAvailableKycDocuments(form.donorType, form.citizenStatus),
    [form.citizenStatus, form.donorType],
  );

  const openAddForm = useCallback(() => {
    setEditingId(null);
    setFormMode("add");
    setForm(getInitialDonorFormData(fundTypes));
  }, [fundTypes]);

  useEffect(() => {
    const autoOpenDecision = getDonorAddAutoOpenDecision(autoOpenAddToken);
    if (!autoOpenDecision.shouldOpen) return;

    openAddForm();
    onAutoOpenAddConsumed?.(autoOpenDecision.nextToken);
  }, [autoOpenAddToken, onAutoOpenAddConsumed, openAddForm]);

  const openEditForm = (donor: DonorRecord) => {
    setEditingId(donor.id);
    setFormMode("edit");
    setForm({
      donorName: donor.donorName,
      donorType: donor.donorType,
      citizenStatus: donor.citizenStatus,
      fundType: donor.fundType,
      kycDocument: donor.kycDocument,
      idNumber: donor.idNumber,
      contactNumber: donor.contactNumber,
      emailId: donor.emailId,
      cinNumber: donor.cinNumber || "",
      address: donor.address,
      modeOfReceipt: donor.modeOfReceipt,
      contactPersonName: donor.contactPersonName || "",
      contactPersonMobileNo: donor.contactPersonMobileNo || "",
      contactPersonEmailId: donor.contactPersonEmailId || "",
    });
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(getInitialDonorFormData(fundTypes));
  };

  const handleDelete = (id: number) => {
    const shouldDelete = window.confirm("Delete this donor?");
    if (!shouldDelete) return;
    onUpdate((data || []).filter((item) => item.id !== id));
  };

  const handleCitizenStatusChange = (citizenStatus: CitizenStatus) => {
    setForm((prev) =>
      sanitizeDonorFormData({
        ...prev,
        citizenStatus,
        fundType: selectDefaultFundType(citizenStatus, fundTypes),
        kycDocument: getDefaultKycDocument(prev.donorType, citizenStatus),
        idNumber:
          shouldUseBlankKycDocument(prev.donorType, citizenStatus) ?
            ""
          : prev.idNumber,
      }),
    );
  };

  const handleDonorTypeChange = (donorType: DonorType) => {
    setForm((prev) => {
      const nextForm = {
        ...prev,
        donorType,
        kycDocument: getDefaultKycDocument(donorType, prev.citizenStatus),
        idNumber:
          shouldUseBlankKycDocument(donorType, prev.citizenStatus) ?
            ""
          : prev.idNumber,
      };
      return sanitizeDonorFormData(nextForm);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedForm = sanitizeDonorFormData({
      ...form,
      donorName: form.donorName.trim(),
      fundType: form.fundType.trim(),
      idNumber: form.idNumber.trim(),
      contactNumber: form.contactNumber.trim(),
      emailId: form.emailId.trim(),
      cinNumber: form.cinNumber.trim(),
      address: form.address.trim(),
      contactPersonName: form.contactPersonName.trim(),
      contactPersonMobileNo: form.contactPersonMobileNo.trim(),
      contactPersonEmailId: form.contactPersonEmailId.trim(),
    });

    const requiredFields = [
      sanitizedForm.donorName,
      sanitizedForm.donorType,
      sanitizedForm.citizenStatus,
      sanitizedForm.fundType,
      sanitizedForm.contactNumber,
      sanitizedForm.emailId,
      sanitizedForm.address,
      sanitizedForm.modeOfReceipt,
    ];

    if (shouldRequireKycAndIdNumber(sanitizedForm.donorType, sanitizedForm.citizenStatus)) {
      requiredFields.push(sanitizedForm.kycDocument, sanitizedForm.idNumber);
    }

    if (requiredFields.some((field) => !field)) {
      window.alert("Please fill all required donor fields.");
      return;
    }

    if (!isValidEmail(sanitizedForm.emailId)) {
      window.alert("Please enter a valid donor email ID.");
      return;
    }

    if (shouldShowContactPersonFields(sanitizedForm.donorType)) {
      if (
        !sanitizedForm.contactPersonName ||
        !sanitizedForm.contactPersonMobileNo ||
        !sanitizedForm.contactPersonEmailId
      ) {
        window.alert("Please fill all contact person fields for Corporate or NGO donors.");
        return;
      }

      if (!isValidEmail(sanitizedForm.contactPersonEmailId)) {
        window.alert("Please enter a valid contact person email ID.");
        return;
      }
    }

    const matchingFundTypes = getEligibleFundTypes(
      sanitizedForm.citizenStatus,
      fundTypes,
    );
    if (matchingFundTypes.length === 0) {
      window.alert(
        sanitizedForm.citizenStatus === "Indian citizen" ?
          "No Local fund type was found in Fund Type Master."
        : "No FCRA fund type was found in Fund Type Master.",
      );
      return;
    }

    const payload: DonorRecord = {
      id: editingId ?? Date.now(),
      donorId:
        (data || []).find((item) => item.id === editingId)?.donorId ||
        getNextDonorSerial(data || []),
      ...sanitizedForm,
    };

    onUpdate(upsertDonorRecord(data || [], payload));
    closeForm();
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";

  const renderValue = (label: string, value: string) => (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {value || "--"}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Donor Database
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
              Manage donor master records from one place
            </p>
          </div>
          <button
            onClick={openAddForm}
            className={`px-4 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
            + Add New Donor
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by donor name, type, citizen status, contact, email, KYC or fund type"
              className="w-full max-w-xl px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3">Donor ID</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">Donor Type</th>
                  <th className="px-4 py-3">Citizen Status</th>
                  <th className="px-4 py-3">Fund Type</th>
                  <th className="px-4 py-3">KYC Document</th>
                  <th className="px-4 py-3">ID Number</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Email ID</th>
                  <th className="px-4 py-3">Mode of Receipt</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">
                      No donors found.
                    </td>
                  </tr>
                )}
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.donorId || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.donorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.donorType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.citizenStatus}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.fundType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.kycDocument}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.idNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.contactNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.emailId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatModeOfReceipt(item.modeOfReceipt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setViewingDonor(item)}
                          className="px-3 py-1 rounded-md border border-sky-200 dark:border-sky-700 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition">
                          View
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 rounded-md border border-rose-200 dark:border-rose-700 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formMode === "add" ? "Add Donor" : "Edit Donor"}
                </h3>
                <p className="text-xs mt-1 text-slate-500 uppercase tracking-widest font-bold">
                  Maintain donor details and receipt metadata
                </p>
              </div>
              <button
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold">
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Donor Name
                  </label>
                  <input
                    type="text"
                    value={form.donorName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, donorName: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Donor Type
                  </label>
                  <select
                    value={form.donorType}
                    onChange={(e) => handleDonorTypeChange(e.target.value as DonorType)}
                    className={inputClass}
                    required>
                    {DONOR_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Citizen Status
                  </label>
                  <select
                    value={form.citizenStatus}
                    onChange={(e) =>
                      handleCitizenStatusChange(e.target.value as CitizenStatus)
                    }
                    className={inputClass}
                    required>
                    <option value="Indian citizen">Indian citizen</option>
                    <option value="Foreign citizen">Foreign citizen</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Fund Type
                  </label>
                  <select
                    value={form.fundType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fundType: e.target.value }))
                    }
                    className={inputClass}
                    required>
                    {eligibleFundTypes.length === 0 && (
                      <option value="">
                        No matching fund type found in Fund Type Master
                      </option>
                    )}
                    {eligibleFundTypes.map((option) => (
                      <option key={String(option.id ?? option.name)} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    KYC Document
                  </label>
                  <select
                    value={form.kycDocument}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        kycDocument: e.target.value as KycDocument,
                      }))
                    }
                    className={inputClass}
                    required={shouldRequireKycAndIdNumber(form.donorType, form.citizenStatus)}
                    disabled={shouldUseBlankKycDocument(form.donorType, form.citizenStatus)}>
                    {shouldUseBlankKycDocument(form.donorType, form.citizenStatus) && (
                      <option value="">--</option>
                    )}
                    {kycOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    ID Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.idNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, idNumber: e.target.value }))
                      }
                      className={inputClass}
                      required={shouldRequireKycAndIdNumber(
                        form.donorType,
                        form.citizenStatus,
                      )}
                    />
                    {shouldShowVerifyPanButton(form.kycDocument) && (
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-[11px] font-extrabold text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20">
                        Verify PAN
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contactNumber: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={form.emailId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, emailId: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Mode of Receipt
                  </label>
                  <select
                    value={form.modeOfReceipt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        modeOfReceipt: e.target.value as ModeOfReceipt,
                      }))
                    }
                    className={inputClass}
                    required>
                    {MODE_OF_RECEIPT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {shouldShowCinNumberField(form.donorType) && (
                  <div>
                    <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      CIN Number
                    </label>
                    <input
                      type="text"
                      value={form.cinNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, cinNumber: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                <div className={DONOR_ADDRESS_FIELD_GRID_CLASS}>
                  <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Address
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    rows={3}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {shouldShowContactPersonFields(form.donorType) && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                    Contact Person Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        Name of Contact Person
                      </label>
                      <input
                        type="text"
                        value={form.contactPersonName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contactPersonName: e.target.value,
                          }))
                        }
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        Contact Person Mobile No.
                      </label>
                      <input
                        type="text"
                        value={form.contactPersonMobileNo}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contactPersonMobileNo: e.target.value,
                          }))
                        }
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        Contact Person Email ID
                      </label>
                      <input
                        type="email"
                        value={form.contactPersonEmailId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contactPersonEmailId: e.target.value,
                          }))
                        }
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg bg-${themeColor} text-white text-sm font-extrabold hover:opacity-90 transition`}>
                  {formMode === "add" ? "Save Donor" : "Update Donor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Donor Details
                </h3>
                <p className="text-xs mt-1 text-slate-500 uppercase tracking-widest font-bold">
                  View saved donor information
                </p>
              </div>
              <button
                onClick={() => setViewingDonor(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-sm font-bold">
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderValue("Donor Name", viewingDonor.donorName)}
                {renderValue("Donor ID", viewingDonor.donorId || "--")}
                {renderValue("Donor Type", viewingDonor.donorType)}
                {renderValue("Citizen Status", viewingDonor.citizenStatus)}
                {renderValue("Fund Type", viewingDonor.fundType)}
                {renderValue("KYC Document", viewingDonor.kycDocument)}
                {renderValue("ID Number", viewingDonor.idNumber)}
                {renderValue("Contact Number", viewingDonor.contactNumber)}
                {renderValue("Email ID", viewingDonor.emailId)}
                {renderValue("Mode of Receipt", viewingDonor.modeOfReceipt)}
                {shouldShowCinNumberField(viewingDonor.donorType) &&
                  renderValue("CIN Number", viewingDonor.cinNumber || "")}
              </div>

              {renderValue("Address", viewingDonor.address)}

              {shouldShowContactPersonFields(viewingDonor.donorType) && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                    Contact Person Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderValue("Name of Contact Person", viewingDonor.contactPersonName)}
                    {renderValue(
                      "Contact Person Mobile No.",
                      viewingDonor.contactPersonMobileNo,
                    )}
                    {renderValue(
                      "Contact Person Email ID",
                      viewingDonor.contactPersonEmailId,
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
