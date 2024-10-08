"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    // Here you would typically send the file to your server
    console.log("Uploading file:", file.name)
    
    // Placeholder for file processing logic
    // In a real application, you'd send this file to your server and process it there
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target) {
        const content = event.target.result
        console.log("File content:", content)
        // Process the file content here or send it to your server
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Carregar Extrato Bancário</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="file">Selecione o arquivo do extrato bancário</Label>
          <Input id="file" type="file" onChange={handleFileChange} accept=".csv,.ofx,.qif" />
        </div>
        <Button type="submit" disabled={!file}>
          Enviar
        </Button>
      </form>
    </div>
  )
}