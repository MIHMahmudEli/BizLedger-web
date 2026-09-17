"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Globe,
  Inbox,
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

const DESIGNATIONS = [
  "Owner", "Manager", "Director", "CEO", "CTO", "CFO", "Accountant",
  "HR Manager", "Sales Manager", "Marketing Manager", "Project Manager",
  "Developer", "Designer", "Consultant", "Assistant", "Other",
];

const PROJECT_TYPES = [
  "Web Development", "Mobile App", "Desktop Application", "E-Commerce",
  "ERP System", "CRM System", "UI/UX Design", "API Development",
  "Cloud Migration", "DevOps", "Data Analytics", "AI/ML",
  "Consulting", "Maintenance", "Other",
];

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNED: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const PROJECT_STATUS_ICONS: Record<ProjectStatus, React.ReactNode> = {
  PLANNED: <FileText className="h-3 w-3" />,
  IN_PROGRESS: <Clock className="h-3 w-3" />,
  ON_HOLD: <StopCircle className="h-3 w-3" />,
  COMPLETED: <CheckCircle2 className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
};

const DESIGNATION_COLORS: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Director: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  CEO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface ContactForm { name: string; designation: string; mobile: string; email: string; }
const emptyContactForm: ContactForm = { name: "", designation: "", mobile: "", email: "" };

interface ProjectForm {
  projectName: string; projectType: string; totalValue: string; status: ProjectStatus;
  startDate: string; deadline: string; description: string;
}
const emptyProjectForm: ProjectForm = {
  projectName: "", projectType: "", totalValue: "", status: "PLANNED",
  startDate: "", deadline: "", description: "",
};

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [contactSaving, setContactSaving] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [contactDeleting, setContactDeleting] = useState(false);
  const [designationSearch, setDesignationSearch] = useState("");
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProjectForm);
  const [projectSaving, setProjectSaving] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [projectTypeSearch, setProjectTypeSearch] = useState("");
  const [projectTypeDropdownOpen, setProjectTypeDropdownOpen] = useState(false);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Company }>(`/companies/${companyId}`);
      setCompany(data.data);
    } catch { router.push("/companies"); } finally { setLoading(false); }
  }, [companyId, router]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const openCreateContact = () => { setEditingContact(null); setContactForm(emptyContactForm); setDesignationSearch(""); setContactDialogOpen(true); };
  const openEditContact = (c: Contact) => { setEditingContact(c); setContactForm({ name: c.name, designation: c.designation ?? "", mobile: c.mobile ?? "", email: c.email ?? "" }); setDesignationSearch(""); setContactDialogOpen(true); };
  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return;
    setContactSaving(true);
    try {
      const body = { name: contactForm.name.trim(), designation: contactForm.designation.trim() || undefined, mobile: contactForm.mobile.trim() || undefined, email: contactForm.email.trim() || undefined };
      if (editingContact) { await api.patch(`/contacts/${editingContact.id}`, body); } else { await api.post(`/companies/${companyId}/contacts`, body); }
      setContactDialogOpen(false); fetchCompany();
    } catch {} finally { setContactSaving(false); }
  };
  const openDeleteContact = (c: Contact) => { setDeletingContact(c); setDeleteContactOpen(true); };
  const handleDeleteContact = async () => {
    if (!deletingContact) return; setContactDeleting(true);
    try { await api.delete(`/contacts/${deletingContact.id}`); setDeleteContactOpen(false); fetchCompany(); } catch {} finally { setContactDeleting(false); }
  };

  const openCreateProject = () => { setEditingProject(null); setProjectForm(emptyProjectForm); setProjectTypeSearch(""); setProjectDialogOpen(true); };
  const openEditProject = (p: Project) => { setEditingProject(p); setProjectForm({ projectName: p.projectName, projectType: p.projectType, totalValue: p.totalValue, status: p.status, startDate: p.startDate ? p.startDate.slice(0, 10) : "", deadline: p.deadline ? p.deadline.slice(0, 10) : "", description: p.description ?? "" }); setProjectTypeSearch(""); setProjectDialogOpen(true); };
  const handleSaveProject = async () => {
    if (!projectForm.projectName.trim()) return; setProjectSaving(true);
    try {
      const body = { projectName: projectForm.projectName.trim(), projectType: projectForm.projectType.trim() || undefined, totalValue: projectForm.totalValue || undefined, status: projectForm.status, startDate: projectForm.startDate || undefined, deadline: projectForm.deadline || undefined, description: projectForm.description.trim() || undefined };
      if (editingProject) { await api.patch(`/projects/${editingProject.id}`, body); } else { await api.post(`/companies/${companyId}/projects`, body); }
      setProjectDialogOpen(false); fetchCompany();
    } catch {} finally { setProjectSaving(false); }
  };
  const openDeleteProject = (p: Project) => { setDeletingProject(p); setDeleteProjectOpen(true); };
  const handleDeleteProject = async () => {
    if (!deletingProject) return; setProjectDeleting(true);
    try { await api.delete(`/projects/${deletingProject.id}`); setDeleteProjectOpen(false); fetchCompany(); } catch {} finally { setProjectDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/companies")} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <span className="text-base font-bold text-primary">
                {company.companyName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{company.companyName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {company.category && (
                  <span className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">{company.category}</Badge>
                  </span>
                )}
                {company.addressArea && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{company.addressArea}
                  </span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" />Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">{company.contacts?.length ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{company.projects?.length ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(company.projects?.reduce((sum, p) => sum + parseFloat(p.totalValue || "0"), 0) ?? 0)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-lg font-bold text-primary">$</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Info */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <p className="text-sm text-muted-foreground">Basic details about this company</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            {company.address && (
              <div className="p-5 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-medium leading-relaxed">{company.address}</p>
                  {company.addressArea && <p className="text-sm text-muted-foreground mt-0.5">{company.addressArea}</p>}
                </div>
              </div>
            )}
            {company.category && (
              <div className="p-5 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{company.category}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Contacts</h2>
              <p className="text-sm text-muted-foreground">{company.contacts?.length ?? 0} team members</p>
            </div>
            <Button size="sm" onClick={openCreateContact} className="gap-1.5">
              <Plus className="h-4 w-4" />Add Contact
            </Button>
          </div>
          {!company.contacts || company.contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">No contacts yet</p>
              <p className="text-sm mt-1">Add your first contact to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="w-[80px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => (
                  <TableRow key={contact.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.designation ? (
                        <Badge variant="secondary" className={`${DESIGNATION_COLORS[contact.designation] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"} font-normal`}>
                          {contact.designation}
                        </Badge>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {contact.mobile ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />{contact.mobile}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{contact.email}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContact(contact)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteContact(contact)}>
                          <Trash2 className="h-4 w-4" />
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
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground">{company.projects?.length ?? 0} active projects</p>
            </div>
            <Button size="sm" onClick={openCreateProject} className="gap-1.5">
              <Plus className="h-4 w-4" />Add Project
            </Button>
          </div>
          {!company.projects || company.projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">No projects yet</p>
              <p className="text-sm mt-1">Create your first project for this company</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-right">Value</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Deadline</TableHead>
                  <TableHead className="w-[80px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.projects.map((project) => (
                  <TableRow key={project.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.projectName}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{project.projectType ?? "-"}</span></TableCell>
                    <TableCell className="text-right font-medium">{project.totalValue ? formatCurrency(project.totalValue) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${PROJECT_STATUS_COLORS[project.status]} font-normal gap-1`}>
                        {PROJECT_STATUS_ICONS[project.status]}
                        {project.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{project.deadline ? formatDate(project.deadline) : "-"}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProject(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteProject(project)}>
                          <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>{editingContact ? "Update the contact details below." : "Fill in the details to add a new contact."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input id="contact-name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-designation">Designation</Label>
              <div className="relative">
                <Input id="contact-designation" value={contactForm.designation || designationSearch}
                  onChange={(e) => { setDesignationSearch(e.target.value); setDesignationDropdownOpen(true); if (contactForm.designation) setContactForm({ ...contactForm, designation: "" }); }}
                  onFocus={() => setDesignationDropdownOpen(true)} onBlur={() => setTimeout(() => setDesignationDropdownOpen(false), 200)} placeholder="Select designation" />
                {designationDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {!designationSearch && !contactForm.designation && (
                      <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                        onMouseDown={() => { setContactForm({ ...contactForm, designation: "" }); setDesignationSearch(""); setDesignationDropdownOpen(false); }}>Select designation</div>
                    )}
                    {DESIGNATIONS.filter((d) => d.toLowerCase().includes(designationSearch.toLowerCase())).map((d) => (
                      <div key={d} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${contactForm.designation === d ? "bg-accent font-medium" : ""}`}
                        onMouseDown={() => { setContactForm({ ...contactForm, designation: d }); setDesignationSearch(""); setDesignationDropdownOpen(false); }}>{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-mobile">Mobile</Label>
              <Input id="contact-mobile" value={contactForm.mobile} onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })} placeholder="+880 1XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="john@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact} disabled={contactSaving || !contactForm.name.trim()}>
              {contactSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingContact ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>Are you sure you want to delete contact <strong>{deletingContact?.name}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContactOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteContact} disabled={contactDeleting}>
              {contactDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>{editingProject ? "Update the project details below." : "Fill in the details to add a new project."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input id="project-name" value={projectForm.projectName} onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })} placeholder="Website Redesign" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-type">Project Type</Label>
                <div className="relative">
                  <Input id="project-type" value={projectForm.projectType || projectTypeSearch}
                    onChange={(e) => { setProjectTypeSearch(e.target.value); setProjectTypeDropdownOpen(true); if (projectForm.projectType) setProjectForm({ ...projectForm, projectType: "" }); }}
                    onFocus={() => setProjectTypeDropdownOpen(true)} onBlur={() => setTimeout(() => setProjectTypeDropdownOpen(false), 200)} placeholder="Select type" />
                  {projectTypeDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {!projectTypeSearch && !projectForm.projectType && (
                        <div className="px-3 py-2 cursor-pointer hover:bg-accent text-muted-foreground text-sm"
                          onMouseDown={() => { setProjectForm({ ...projectForm, projectType: "" }); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); }}>Select type</div>
                      )}
                      {PROJECT_TYPES.filter((t) => t.toLowerCase().includes(projectTypeSearch.toLowerCase())).map((t) => (
                        <div key={t} className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${projectForm.projectType === t ? "bg-accent font-medium" : ""}`}
                          onMouseDown={() => { setProjectForm({ ...projectForm, projectType: t }); setProjectTypeSearch(""); setProjectTypeDropdownOpen(false); }}>{t}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-value">Total Value</Label>
                <Input id="project-value" type="number" value={projectForm.totalValue} onChange={(e) => setProjectForm({ ...projectForm, totalValue: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <Select value={projectForm.status} onValueChange={(value) => setProjectForm({ ...projectForm, status: value as ProjectStatus })}>
                  <SelectTrigger id="project-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-start">Start Date</Label>
                <Input id="project-start" type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-deadline">Deadline</Label>
                <Input id="project-deadline" type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Input id="project-desc" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Brief description of the project" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProject} disabled={projectSaving || !projectForm.projectName.trim()}>
              {projectSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingProject ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>Are you sure you want to delete project <strong>{deletingProject?.projectName}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={projectDeleting}>
              {projectDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
