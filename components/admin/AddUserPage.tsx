import React, { useEffect, useState } from "react";

interface MasterItem {
  id: number;
  name: string;
  code: string;
}

export interface UserRecord {
  id?: number;
  name: string;
  email: string;
  type: string;
  role: string;
  fund: string;
  grant: string;
  func: string;
  proj: string;
  status: string;
  creator?: string;
  date?: string;
}

interface AddUserPageProps {
  onCancel: () => void;
  onSave: (user: UserRecord) => void;
  masterLists: {
    funds: MasterItem[];
    grants: MasterItem[];
    functions: MasterItem[];
    projects: MasterItem[];
  };
  initialUser?: UserRecord;
  themeColor?: string;
}

const EMPTY_USER: UserRecord = {
  name: "",
  email: "",
  type: "Employee",
  role: "User",
  fund: "",
  grant: "",
  func: "",
  proj: "",
  status: "Active",
};

export const AddUserPage: React.FC<AddUserPageProps> = ({
  onCancel,
  onSave,
  masterLists,
  initialUser,
  themeColor = "indigo-600",
}) => {
  const [formData, setFormData] = useState<UserRecord>(
    initialUser ? { ...EMPTY_USER, ...initialUser } : EMPTY_USER,
  );

  useEffect(() => {
    setFormData(initialUser ? { ...EMPTY_USER, ...initialUser } : EMPTY_USER);
  }, [initialUser]);

  const handleFieldChange = <K extends keyof UserRecord>(
    field: K,
    value: UserRecord[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
    });
  };

  const isEditing = Boolean(initialUser?.id);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit User" : "Add User"}
          </h1>
          <p className="text-slate-500">
            {isEditing ?
              "Update the selected user and save the revised master data."
            : "Create a new system user and assign permissions based on current master data."
            }
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-6">
          <form
            className="space-y-6"
            onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    User Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFieldChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select User Type</option>
                    <option value="Employee">Employee</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFieldChange("role", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Role</option>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Approver">Approver</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleFieldChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fund
                  </label>
                  <select
                    value={formData.fund}
                    onChange={(e) => handleFieldChange("fund", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Fund</option>
                    {masterLists.funds.map((f) => (
                      <option
                        key={f.id}
                        value={f.code}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grant
                  </label>
                  <select
                    value={formData.grant}
                    onChange={(e) => handleFieldChange("grant", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Grant</option>
                    {masterLists.grants.map((g) => (
                      <option
                        key={g.id}
                        value={g.code}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Function
                  </label>
                  <select
                    value={formData.func}
                    onChange={(e) => handleFieldChange("func", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Function</option>
                    {masterLists.functions.map((f) => (
                      <option
                        key={f.id}
                        value={f.code}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.proj}
                    onChange={(e) => handleFieldChange("proj", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Select Project</option>
                    {masterLists.projects.map((p) => (
                      <option
                        key={p.id}
                        value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onCancel}
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md transition border border-slate-200">
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white bg-${themeColor} hover:brightness-110 rounded-md transition shadow-sm`}>
                {isEditing ? "Update User" : "Save User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
