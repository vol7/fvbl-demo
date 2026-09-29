import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DecisionCopy } from "@/regions/types"

type Copy = NonNullable<DecisionCopy["blocked"]["issueAfterReview"]>

/**
 * Issuing over a hold: the clerk's office decides, and says why in one line. Quiet
 * on purpose; the hold's first action is the referral. The note goes on the ledger.
 */
export function ReviewIssueDialog({
  copy,
  onIssue,
}: {
  copy: Copy
  onIssue: (reviewNote: string) => void
}) {
  const [note, setNote] = useState("")
  const ready = note.trim().length > 0

  return (
    <Dialog onOpenChange={(open) => !open && setNote("")}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
      >
        {copy.action}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-note">{copy.noteLabel}</Label>
          <Input
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose
            render={<Button disabled={!ready} />}
            onClick={() => ready && onIssue(note.trim())}
          >
            {copy.confirm}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
