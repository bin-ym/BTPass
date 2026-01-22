"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import type { User, CreateUsherForm } from "@/lib/types";

export default function UshersPage() {
  const [ushers, setUshers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsher, setEditingUsher] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUsherForm>({
    name: "",
    email: "",
    phone: "",
    pin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUshers();
  }, []);

  async function fetchUshers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "USHER")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUshers(data || []);
    } catch (error) {
      console.error("Error fetching ushers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUsher) {
        // Update existing usher
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
          })
          .eq("id", editingUsher.id);

        if (error) throw error;
      } else {
        // Create new usher
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email,
            password: formData.pin,
            options: {
              data: {
                name: formData.name,
                role: "USHER",
              },
            },
          }
        );

        if (authError) throw authError;

        if (authData.user) {
          // Insert into users table
          const { error: insertError } = await supabase.from("users").insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: "USHER",
            active: true,
          });

          if (insertError) throw insertError;
        }
      }

      await fetchUshers();
      closeModal();
    } catch (error: any) {
      console.error("Error saving usher:", error);
      alert(error.message || "Failed to save usher");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(usher: User) {
    if (!confirm(`Are you sure you want to delete ${usher.name}?`)) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", usher.id);

      if (error) throw error;
      await fetchUshers();
    } catch (error) {
      console.error("Error deleting usher:", error);
      alert("Failed to delete usher");
    }
  }

  function openModal(usher?: User) {
    if (usher) {
      setEditingUsher(usher);
      setFormData({
        name: usher.name,
        email: usher.email || "",
        phone: usher.phone || "",
        pin: "",
      });
    } else {
      setEditingUsher(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        pin: "",
      });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUsher(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      pin: "",
    });
  }

  const filteredUshers = ushers.filter(
    (usher) =>
      usher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (value) => value || "N/A" },
    {
      key: "active",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, usher) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(usher)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(usher)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ushers</h1>
          <p className="text-gray-600 mt-1">Manage your event ushers</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={20} className="mr-2" />
          Add Usher
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table
          columns={columns}
          data={filteredUshers}
          isLoading={isLoading}
          emptyMessage="No ushers found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUsher ? "Edit Usher" : "Add New Usher"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={!!editingUsher}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+251912345678"
            />
          </div>

          {!editingUsher && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN (Password) *
              </label>
              <input
                type="password"
                required
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {editingUsher ? "Update Usher" : "Create Usher"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
