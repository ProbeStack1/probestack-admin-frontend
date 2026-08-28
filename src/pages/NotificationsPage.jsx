import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import { notificationsApi } from "../lib/api";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Mail, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import PaginationControls, { usePagination } from "../components/PaginationControls";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [groupEmails, setGroupEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread
  const [groupDialog, setGroupDialog] = useState({ open: false, emailRecord: null });
  const [groupForm, setGroupForm] = useState({ email: "", name: "", is_active: true });
  const [deleteGroupDialog, setDeleteGroupDialog] = useState({ open: false, emailRecord: null });

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params = filter === "unread" ? { unread_only: true } : {};
      const [notificationsResponse, groupResponse] = await Promise.all([
        notificationsApi.getAll(params),
        notificationsApi.getGroupEmails(),
      ]);
      setNotifications(notificationsResponse.data);
      setGroupEmails(groupResponse.data || []);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notif) => {
    try {
      await notificationsApi.markRead(notif.id);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notif) => {
    try {
      await notificationsApi.delete(notif.id);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const openGroupDialog = (emailRecord = null) => {
    setGroupDialog({ open: true, emailRecord });
    setGroupForm({
      email: emailRecord?.email || "",
      name: emailRecord?.name || "",
      is_active: emailRecord?.is_active ?? true,
    });
  };

  const handleSaveGroupEmail = async () => {
    if (!groupForm.email.trim()) return;
    try {
      const payload = {
        email: groupForm.email.trim(),
        name: groupForm.name.trim() || null,
        is_active: groupForm.is_active,
      };
      if (groupDialog.emailRecord) {
        await notificationsApi.updateGroupEmail(groupDialog.emailRecord.id, payload);
        toast.success("Notification email updated");
      } else {
        await notificationsApi.createGroupEmail(payload);
        toast.success("Notification email added");
      }
      setGroupDialog({ open: false, emailRecord: null });
      setGroupForm({ email: "", name: "", is_active: true });
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save notification email");
    }
  };

  const handleDeleteGroupEmail = async () => {
    if (!deleteGroupDialog.emailRecord) return;
    try {
      await notificationsApi.deleteGroupEmail(deleteGroupDialog.emailRecord.id);
      toast.success("Notification email deleted");
      fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete notification email");
    } finally {
      setDeleteGroupDialog({ open: false, emailRecord: null });
    }
  };

  const handleClick = (notif) => {
    if (!notif.is_read) {
      handleMarkRead(notif);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10";
      case "warning":
        return "bg-amber-500/10";
      case "error":
        return "bg-rose-500/10";
      default:
        return "bg-blue-500/10";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const notificationsPagination = usePagination(notifications);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="notifications-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} data-testid="mark-all-read-btn">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/50" data-testid="notification-group-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Mail className="h-5 w-5 text-primary" />
                Notification Group
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Emails included on admin and billing notifications.</p>
            </div>
            <Button size="sm" onClick={() => openGroupDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Email
            </Button>
          </div>
          <div className="mt-4 divide-y divide-border rounded-md border">
            {groupEmails.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notification group emails configured.</div>
            ) : (
              groupEmails.map((emailRecord) => (
                <div key={emailRecord.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{emailRecord.email}</p>
                      <Badge variant={emailRecord.is_active ? "secondary" : "outline"}>
                        {emailRecord.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {emailRecord.name && <p className="mt-1 text-sm text-muted-foreground">{emailRecord.name}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openGroupDialog(emailRecord)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteGroupDialog({ open: true, emailRecord })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-border/50" data-testid="notifications-list">
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No notifications</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {filter === "unread" ? "All notifications have been read" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificationsPagination.pageItems.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleClick(notif)}
                  data-testid={`notif-${notif.id}`}
                >
                  <div className={`p-2 rounded-lg ${getBgColor(notif.type)} flex-shrink-0`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notif.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(notif); }}
                        data-testid={`mark-read-btn-${notif.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif); }}
                      data-testid={`delete-btn-${notif.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls {...notificationsPagination} onPageChange={notificationsPagination.setPage} />
        </CardContent>
      </Card>

      <Dialog open={groupDialog.open} onOpenChange={(open) => setGroupDialog({ open, emailRecord: open ? groupDialog.emailRecord : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{groupDialog.emailRecord ? "Update Notification Email" : "Add Notification Email"}</DialogTitle>
            <DialogDescription>Manage one recipient in the ProbeStack notification group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={groupForm.email}
                onChange={(event) => setGroupForm({ ...groupForm, email: event.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={groupForm.name}
                onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                placeholder="Admin name"
              />
            </div>
            <label className="flex items-center justify-between rounded-md border p-3">
              <span>
                <span className="block text-sm font-medium">Active</span>
                <span className="text-xs text-muted-foreground">Inactive emails stay saved but are skipped.</span>
              </span>
              <Switch
                checked={groupForm.is_active}
                onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_active: checked })}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialog({ open: false, emailRecord: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroupEmail} disabled={!groupForm.email.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteGroupDialog.open} onOpenChange={(open) => setDeleteGroupDialog({ open, emailRecord: open ? deleteGroupDialog.emailRecord : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification Email</DialogTitle>
            <DialogDescription>Delete {deleteGroupDialog.emailRecord?.email} from the notification group?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupDialog({ open: false, emailRecord: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroupEmail}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
