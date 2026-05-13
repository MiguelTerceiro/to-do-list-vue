const EMAIL_REGEX = /^\S+@\S+\.\S+$/

export function validateLoginForm(form, t) {
  const errors = {}

  if (!form.email.trim()) {
    errors.email = t('validation.emailRequired')
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = t('validation.emailInvalid')
  }

  if (!form.password.trim()) {
    errors.password = t('validation.passwordRequired')
  }

  return errors
}

export function validateRegisterForm(form, t) {
  const errors = {}

  if (!form.username.trim()) {
    errors.username = t('validation.usernameRequired')
  }

  if (!form.email.trim()) {
    errors.email = t('validation.emailRequired')
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.email = t('validation.emailInvalid')
  }

  if (!form.password.trim()) {
    errors.password = t('validation.passwordRequired')
  } else if (form.password.trim().length < 6) {
    errors.password = t('validation.passwordMin')
  }

  return errors
}

export function validateTaskTitle(title, t) {
  if (!title.trim()) {
    return t('validation.taskRequired')
  }

  return ''
}
