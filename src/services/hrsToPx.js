export const hrsToStart = (appt_start, top = null) => {
  const begin = top ? top : new Date(appt_start.getTime()).setHours(0,0,0,0)
  return (Math.abs(begin - appt_start) / 3600000)
}

export const duration = (start, end) => Math.abs(end - start) / 3600000
