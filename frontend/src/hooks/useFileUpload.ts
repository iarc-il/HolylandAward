import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

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


const postAdif = async (file: File, spotterCallsign = '4Z5SL'): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file) // field name must be "file" to match UploadFile=File(...)

  const res = await apiClient.upload(`/read-file?spotter_callsign=${encodeURIComponent(spotterCallsign)}`, formData)
  return res.json()
}

const useAdifUpload = () => {
  return useMutation({
    mutationFn: ({ file }: { file: File }) =>
      postAdif(file, "4Z5SL"),
  })
}

export default useAdifUpload;
