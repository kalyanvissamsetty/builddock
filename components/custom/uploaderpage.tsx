import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import FileUpload from "./FileUpload"

export default function UploaderPage() {
  return (
    <div className="w-full max-w-4xl py-20 mx-auto flex flex-col items-center border rounded-lg justify-between gap-10">
        <h2 className="font-semibold text-2xl font-stretch-expanded">Upload Build</h2>
        <Select>
            <SelectTrigger className="w-full max-w-100">
                <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                <SelectLabel>Projects</SelectLabel>
                <SelectItem value="mbta">MBTA</SelectItem>
                <SelectItem value="mdu">MDU</SelectItem>
                <SelectItem value="pge">PG&E</SelectItem>
                <SelectItem value="vmi">VMI</SelectItem>
                <SelectItem value="eversource">Eversource</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>

        <Select>
            <SelectTrigger className="w-full max-w-100">
                <SelectValue placeholder="Select Environment" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                <SelectLabel>Environment</SelectLabel>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="clienttesting">Client Testing</SelectItem>
                <SelectItem value="internaltesting">Internal Testing</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>

        <FileUpload/>
    </div>
    
  )
}
