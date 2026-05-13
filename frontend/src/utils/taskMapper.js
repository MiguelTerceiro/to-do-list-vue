export function formatTaskDate(dateValue, locale = 'pt') {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'pt-PT')
}

export function mapApiTask(task, locale = 'pt') {
  const isShared = Boolean(task.isShared)
  const ownerDisplayName = task.owner_username || task.owner_email || ''
  const shareCount = Number(task.share_count || 0)
  const sharedWithSummary = task.shared_with_summary || ''

  return {
    id: task.id,
    title: task.title,
    completed: Boolean(task.completed),
    createdAt: task.created_at ?? null,
    formattedDate: formatTaskDate(task.created_at, locale),
    isShared,
    canManage: !isShared,
    canToggle: true,
    canShare: !isShared,
    ownerId: task.owner_id ?? null,
    ownerUsername: task.owner_username ?? '',
    ownerEmail: task.owner_email ?? '',
    ownerDisplayName,
    sharedAt: task.shared_at ?? null,
    formattedSharedDate: formatTaskDate(task.shared_at, locale),
    shareCount,
    sharedWithSummary,
    hasShares: !isShared && shareCount > 0
  }
}

export function refreshTaskDate(task, locale = 'pt') {
  return {
    ...task,
    formattedDate: formatTaskDate(task.createdAt, locale),
    formattedSharedDate: formatTaskDate(task.sharedAt, locale)
  }
}
