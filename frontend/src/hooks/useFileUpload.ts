import { useMutation } from '@tanstack/react-query'

type QSO = {
  date: string
  freq: number
  spotter: string
  dx: string
  area: string
}

type UploadResponse = {
  message: string
  qsos: QSO[]
}


const postAdif = async (file: File, spotterCallsign = '4Z1KD'): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file) // field name must be "file" to match UploadFile=File(...)

  const res = await fetch(`http://localhost:1293/read-file?spotter_callsign=${encodeURIComponent(spotterCallsign)}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Upload failed (${res.status})`)
  }
  return res.json()
}

const useAdifUpload = () => {
  return useMutation({
    mutationFn: ({ file, spotter }: { file: File; spotter?: string }) =>
      postAdif(file, spotter),
  })
}

export default useAdifUpload;
