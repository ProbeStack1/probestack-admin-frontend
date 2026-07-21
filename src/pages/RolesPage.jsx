import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { rolesApi } from "../lib/api";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { format } from "date-fns";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      setRoles(response.data || []);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return format(new Date(value), "MMM d, yyyy");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="roles-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground mt-1">Global role catalog and product permissions</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No standard roles found</h3>
              <p className="text-muted-foreground text-sm mt-1">Run the role migration to create the global catalog.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{role.name}</p>
                            <Badge variant="secondary" className="text-xs">Global</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{role.description || "No description"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">{permission}</Badge>
                        ))}
                        {(role.permissions || []).length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{role.permissions.length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(role.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
