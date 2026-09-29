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
 */
export function RequestDialog({
  ownerPhoneLast4,
  onRequest,
}: {
  ownerPhoneLast4: string
  onRequest: (applicant: ApplicantDetails) => void
}) {
  const pack = useRegion()
  const [name, setName] = useState<string>(pack.people.buyer.name)
  const [licence, setLicence] = useState<string>(pack.people.buyer.licence)
  const [mobile, setMobile] = useState<string>(pack.people.buyer.mobile)

  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="lg" className="px-4 has-data-[icon=inline-start]:pl-3.5" />}
      >
        <Send data-icon="inline-start" aria-hidden />
        Request owner authorization
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request owner authorization</DialogTitle>
          <DialogDescription>
            The registered owner gets a text at the phone ending in {ownerPhoneLast4} with a link to
            approve or decline.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field id="applicant-name" label="Applicant" value={name} onChange={setName} />
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
            Send request
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
