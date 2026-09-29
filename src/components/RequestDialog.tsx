import { Send } from "lucide-react"
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
import { useRegion } from "@/regions"

/** What the clerk types before requesting owner authorization. */
export type ApplicantDetails = { name: string; licence: string; mobile: string }

function Field({
  id,
  label,
  value,
  onChange,
  mono,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={mono ? "font-mono tracking-wider" : undefined}
        autoComplete="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      />
    </div>
  )
}

/**
 * The applicant at the counter, prefilled with the demo buyer. Opened from the
 * header card when the checks are clear; the request itself goes to the owner.
 * In the US it is the secondary action beside Issue title: asking is optional.
 */
export function RequestDialog({
  ownerPhoneLast4,
  onRequest,
  secondary = false,
}: {
  ownerPhoneLast4: string
  onRequest: (applicant: ApplicantDetails) => void
  secondary?: boolean
}) {
  const pack = useRegion()
  const copy = pack.copy.decision.request
  const [name, setName] = useState<string>(pack.people.buyer.name)
  const [licence, setLicence] = useState<string>(pack.people.buyer.licence)
  const [mobile, setMobile] = useState<string>(pack.people.buyer.mobile)

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="lg"
            variant={secondary ? "outline" : "default"}
            className="px-4 has-data-[icon=inline-start]:pl-3.5"
          />
        }
      >
        <Send data-icon="inline-start" aria-hidden />
        {copy.action}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description(ownerPhoneLast4)}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field id="applicant-name" label={copy.applicantLabel} value={name} onChange={setName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="applicant-licence"
              label={pack.copy.portal.request.licenceLabel}
              value={licence}
              onChange={setLicence}
              mono
            />
            <Field
              id="applicant-mobile"
              label="Mobile number"
              value={mobile}
              onChange={setMobile}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />} onClick={() => onRequest({ name, licence, mobile })}>
            {copy.send}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
