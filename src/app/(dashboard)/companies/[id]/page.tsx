"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  StopCircle,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company, Contact, Project, ProjectStatus } from "@/types";

/* ────────────────────── Forms ────────────────────── */

interface ContactForm {
  name: string;
  designation: string;
  mobile: string;
  email: string;
}

const emptyContactForm: ContactForm = {
  name: "",
  designation: "",
  mobile: "",
  email: "",
};

interface ProjectForm {
  projectName: string;
  projectType: string;
  totalValue: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  description: string;
}

const emptyProjectForm: ProjectForm = {
  projectName: "",
  projectType: "",
  totalValue: "",
  status: "PLANNED",
  startDate: "",
  deadline: "",
  description: "",
};

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

/* ────────────────────── Helpers ────────────────────── */

function statusBadgeVariant(
  status: ProjectStatus
): "info" | "success" | "warning" | "destructive" {
  switch (status) {
    case "PLANNED":
      return "info";
    case "IN_PROGRESS":
      return "success";
    case "ON_HOLD":
      return "warning";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "destructive";
    default:
      return "info";
  }
}

function statusIcon(status: ProjectStatus) {
  switch (status) {
    case "PLANNED":
      return <FileText className="h-3.5 w-3.5" />;
    case "IN_PROGRESS":
      return <Clock className="h-3.5 w-3.5" />;
    case "ON_HOLD":
      return <StopCircle className="h-3.5 w-3.5" />;
    case "COMPLETED":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "CANCELLED":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <Inbox className="h-3.5 w-3.5" />;
  }
}

/* ────────────────────── Page ────────────────────── */

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  /* Contact state */
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [contactSaving, setContactSaving] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [contactDeleting, setContactDeleting] = useState(false);

  /* Project state */
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProjectForm);
  const [projectSaving, setProjectSaving] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [projectDeleting, setProjectDeleting] = useState(false);

  /* ── Fetch ── */

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Company }>(`/companies/${companyId}`);
      setCompany(data.data);
    } catch {
      router.push("/companies");
    } finally {
      setLoading(false);
    }
  }, [companyId, router]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  /* ── Contact CRUD ── */

  const openCreateContact = () => {
    setEditingContact(null);
    setContactForm(emptyContactForm);
    setContactDialogOpen(true);
  };

  const openEditContact = (c: Contact) => {
    setEditingContact(c);
    setContactForm({
      name: c.name,
      designation: c.designation ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
    });
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return;
    setContactSaving(true);
    try {
      const body = {
        name: contactForm.name.trim(),
        designation: contactForm.designation.trim() || undefined,
        mobile: contactForm.mobile.trim() || undefined,
        email: contactForm.email.trim() || undefined,
      };

      if (editingContact) {
        await api.patch(`/contacts/${editingContact.id}`, body);
      } else {
        await api.post(`/companies/${companyId}/contacts`, body);
      }
      setContactDialogOpen(false);
      fetchCompany();
    } catch {
      // error handled silently
    } finally {
      setContactSaving(false);
    }
  };

  const openDeleteContact = (c: Contact) => {
    setDeletingContact(c);
    setDeleteContactOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    setContactDeleting(true);
    try {
      await api.delete(`/contacts/${deletingContact.id}`);
      setDeleteContactOpen(false);
      fetchCompany();
    } catch {
      // error handled silently
    } finally {
      setContactDeleting(false);
    }
  };

  /* ── Project CRUD ── */

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    setProjectDialogOpen(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      projectName: p.projectName,
      projectType: p.projectType,
      totalValue: p.totalValue,
      status: p.status,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      deadline: p.deadline ? p.deadline.slice(0, 10) : "",
      description: p.description ?? "",
    });
    setProjectDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.projectName.trim()) return;
    setProjectSaving(true);
    try {
      const body = {
        projectName: projectForm.projectName.trim(),
        projectType: projectForm.projectType.trim() || undefined,
        totalValue: projectForm.totalValue || undefined,
        status: projectForm.status,
        startDate: projectForm.startDate || undefined,
        deadline: projectForm.deadline || undefined,
        description: projectForm.description.trim() || undefined,
      };

      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, body);
      } else {
        await api.post(`/companies/${companyId}/projects`, body);
      }
      setProjectDialogOpen(false);
      fetchCompany();
    } catch {
      // error handled silently
    } finally {
      setProjectSaving(false);
    }
  };

  const openDeleteProject = (p: Project) => {
    setDeletingProject(p);
    setDeleteProjectOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setProjectDeleting(true);
    try {
      await api.delete(`/projects/${deletingProject.id}`);
      setDeleteProjectOpen(false);
      fetchCompany();
    } catch {
      // error handled silently
    } finally {
      setProjectDeleting(false);
    }
  };

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{company.companyName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {company.category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {company.category}
              </span>
            )}
            {company.addressArea && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {company.addressArea}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Name</dt>
              <dd className="mt-1 text-sm">{company.companyName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Category</dt>
              <dd className="mt-1 text-sm">{company.category ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Area</dt>
              <dd className="mt-1 text-sm">{company.addressArea ?? "-"}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-medium text-muted-foreground">Address</dt>
              <dd className="mt-1 text-sm">{company.address ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">{formatDate(company.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Updated</dt>
              <dd className="mt-1 text-sm">{formatDate(company.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Contacts{" "}
            <span className="text-muted-foreground font-normal">
              ({company.contacts?.length ?? 0})
            </span>
          </CardTitle>
          <Button size="sm" onClick={openCreateContact}>
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {!company.contacts || company.contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">No contacts yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.designation ?? "-"}
                    </TableCell>
                    <TableCell>
                      {contact.mobile ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.mobile}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditContact(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteContact(contact)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Projects{" "}
            <span className="text-muted-foreground font-normal">
              ({company.projects?.length ?? 0})
            </span>
          </CardTitle>
          <Button size="sm" onClick={openCreateProject}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent>
          {!company.projects || company.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.projectName}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.projectType ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {project.totalValue
                        ? formatCurrency(project.totalValue)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(project.status)}>
                        <span className="flex items-center gap-1">
                          {statusIcon(project.status)}
                          {project.status.replace(/_/g, " ")}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.startDate ? formatDate(project.startDate) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.deadline ? formatDate(project.deadline) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProject(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteProject(project)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Update the contact details below."
                : "Fill in the details to add a new contact."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-designation">Designation</Label>
              <Input
                id="contact-designation"
                value={contactForm.designation}
                onChange={(e) =>
                  setContactForm({ ...contactForm, designation: e.target.value })
                }
                placeholder="Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-mobile">Mobile</Label>
              <Input
                id="contact-mobile"
                value={contactForm.mobile}
                onChange={(e) =>
                  setContactForm({ ...contactForm, mobile: e.target.value })
                }
                placeholder="+880 1XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveContact}
              disabled={contactSaving || !contactForm.name.trim()}
            >
              {contactSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingContact ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <Dialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete contact{" "}
              <strong>{deletingContact?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContactOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContact}
              disabled={contactDeleting}
            >
              {contactDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Add Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project details below."
                : "Fill in the details to add a new project."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectForm.projectName}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, projectName: e.target.value })
                  }
                  placeholder="Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-type">Project Type</Label>
                <Input
                  id="project-type"
                  value={projectForm.projectType}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, projectType: e.target.value })
                  }
                  placeholder="Web Development"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-value">Total Value</Label>
                <Input
                  id="project-value"
                  type="number"
                  value={projectForm.totalValue}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, totalValue: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value) =>
                    setProjectForm({ ...projectForm, status: value as ProjectStatus })
                  }
                >
                  <SelectTrigger id="project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-1.5">
                          {statusIcon(opt.value)}
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-start">Start Date</Label>
                <Input
                  id="project-start"
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-deadline">Deadline</Label>
                <Input
                  id="project-deadline"
                  type="date"
                  value={projectForm.deadline}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, deadline: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Input
                id="project-desc"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
                placeholder="Brief description of the project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={projectSaving || !projectForm.projectName.trim()}
            >
              {projectSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingProject ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete project{" "}
              <strong>{deletingProject?.projectName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={projectDeleting}
            >
              {projectDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
