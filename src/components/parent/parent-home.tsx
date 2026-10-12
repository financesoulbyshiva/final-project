"use client";

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequireRole } from "@/components/auth/require-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  apiFetch,
  getStoredUser,
  getUserInitials,
  type Child,
  type ChildOverview,
  type ProfileUser,
} from "@/lib/api";
import { cn } from "cn";
import { useTimeGreeting } from "@/lib/time-greeting";
import { ProfileEditor } from "@/components/auth/profile-editor";

type Tab = "children" | "profile";

export function ParentHome() {
  const [tab, setTab] = React.useState<Tab>("children");
  const user = getStoredUser();
  const { personalizedGreeting } = useTimeGreeting(user?.name);

  return (
    <RequireRole role="parent" title="Parent">
      <div className="grid gap-5">
        <section className="flex items-center gap-4">
          <Avatar className="size-14 ring-2 ring-primary/20 shrink-0 shadow-sm">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user?.name || "Parent"} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
              {getUserInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 suppressHydrationWarning className="font-heading text-2xl font-semibold">
              {personalizedGreeting}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email ?? ""} · Track your child&apos;s learning.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {(["children", "profile"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                tab === t && "border-primary bg-primary/5 text-primary"
              )}
            >
              {t === "children" ? "Children" : "Profile"}
            </button>
          ))}
        </div>

        {tab === "children" ? <ChildrenPanel /> : null}
        {tab === "profile" ? <ProfilePanel /> : null}
      </div>
    </RequireRole>
  );
}

function ChildrenPanel() {
  const [children, setChildren] = React.useState<Child[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [linking, setLinking] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);

  async function load() {
    try {
      const d = await apiFetch<{ children: Child[] }>("/parent/children");
      setChildren(d.children);
      if (d.children.length === 0) {
        setSelected(null);
      } else if (!selected || !d.children.some((c) => c.id === selected)) {
        setSelected(d.children[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load children");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function link(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setError("");
    setInfo("");
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>("/parent/link", {
        method: "POST",
        body: { studentEmail: email.trim().toLowerCase() },
      });
      setEmail("");
      setInfo(res.message || "If an active student account exists for this email, it has been linked.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link student");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Link a child</CardTitle>
          <CardDescription>
            Enter your child&apos;s registered student email to connect their learning progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={link}>
            <label className="grid flex-1 gap-1.5 text-sm font-medium">
              Student email
              <Input
                required
                type="email"
                className="h-10"
                value={email}
                disabled={linking}
                placeholder="child@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={linking}>
              {linking ? "Linking…" : "Link child"}
            </Button>
          </form>
          {error ? (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {info ? (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-sm text-foreground">
              {info}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your children</CardTitle>
          <CardDescription>{children.length} linked</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children linked yet. Use the form above to link a child account.</p>
          ) : (
            children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted",
                  selected === c.id && "border-primary bg-primary/5 ring-1 ring-primary/20"
                )}
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.email}
                    {c.grade ? ` · ${c.grade}` : ""}
                    {c.board ? ` · ${c.board}` : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {selected ? <ChildOverviewPanel studentId={selected} /> : null}
    </div>
  );
}

function ChildOverviewPanel({ studentId }: { studentId: string }) {
  const [data, setData] = React.useState<ChildOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    setError("");
    (async () => {
      try {
        const d = await apiFetch<ChildOverview>(`/parent/child/${studentId}/overview`);
        if (active) setData(d);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load child data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data?.student.name ?? "Child"} — progress</CardTitle>
        <CardDescription>
          {data ? `${data.completedCount} lessons completed · ${data.student.xp} XP` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading child progress…</p>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weak topics
              </span>
              {data.weakTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weak topics. Great job!</p>
              ) : (
                data.weakTopics.map((w) => (
                  <div key={w.topicId} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{w.topicName}</p>
                      <p className="text-xs text-muted-foreground">{w.chapterName}</p>
                    </div>
                    <Badge variant="destructive">{w.score}%</Badge>
                  </div>
                ))
              )}
            </div>
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent results
              </span>
              {data.attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attempts recorded yet.</p>
              ) : (
                data.attempts.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{a.topic.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.topic.chapter.name} · {a.mode} · {a.correct}/{a.total}
                      </p>
                    </div>
                    <Badge variant={a.score >= 60 ? "secondary" : "destructive"}>{a.score}%</Badge>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProfilePanel() {
  return <ProfileEditor role="parent" showXp={false} />;
}

