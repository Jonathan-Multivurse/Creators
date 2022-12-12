export function phoneValidator(phone) {
    if (!phone) return "Phone can't be empty."
    if (phone.length < 10) return 'Ooops! We need a valid phone number.'
    return ''
  }