"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIssueAction, updateIssueAction } from "@/actions/issue.actions";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { IssueDTO, UserDTO, Status, Priority } from "@/types";

interface IssueFormProps {
  issue?: IssueDTO;
  members: Pick<UserDTO, "id" | "name">[];
  onSuccess?: () => void;
}

export function IssueForm({ issue, members, onSuccess }: IssueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!issue;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (isEditing) {
      formData.set("id", issue.id);
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateIssueAction(formData)
        : await createIssueAction(formData);

      if (result.success) {
        router.refresh();
        onSuccess?.();
        if (!isEditing) {
          router.push("/issues");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Describe the issue briefly..."
          defaultValue={issue?.title ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Add more context, steps to reproduce, or expected behavior..."
          defaultValue={issue?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={issue?.status ?? "OPEN"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [Status, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={issue?.priority ?? "MEDIUM"}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedToId">Assign to</Label>
        <Select
          name="assignedToId"
          defaultValue={issue?.assignedToId ?? "UNASSIGNED"}
        >
          <SelectTrigger id="assignedToId">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save changes" : "Create issue"}
        </Button>
      </div>
    </form>
  );
}
