<script setup>
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    required: true
  },
  draftTitle: {
    type: String,
    required: true
  },
  editError: {
    type: String,
    default: ''
  },
  isShareOpen: {
    type: Boolean,
    default: false
  },
  shareDraft: {
    type: String,
    default: ''
  },
  shareError: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'toggle-done',
  'start-edit',
  'save-edit',
  'cancel-edit',
  'start-share',
  'cancel-share',
  'confirm-share',
  'remove-task',
  'update:draftTitle',
  'update:shareDraft'
])

const editInput = ref(null)
const { t } = useI18n()

watch(
  () => props.isEditing,
  async (isEditing) => {
    if (!isEditing) {
      return
    }

    await nextTick()
    editInput.value?.focus()
  }
)
</script>

<template>
  <li :class="['task-card', { done: task.completed }]">
    <button
      type="button"
      class="checkbox"
      :disabled="disabled || !task.canToggle"
      :aria-label="task.completed ? t('actions.markPending') : t('actions.markDone')"
      @click="emit('toggle-done', task)"
    >
      <span v-if="task.completed">&#10003;</span>
    </button>

    <div class="task-body">
      <div class="task-headline">
        <span :class="['task-state', task.completed ? 'done' : 'pending']">
          {{ task.completed ? t('tabs.done') : t('tabs.pending') }}
        </span>
        <span v-if="task.isShared" class="task-badge shared">{{ t('shared.badge') }}</span>
        <span v-else-if="task.hasShares" class="task-badge owner">{{ t('shared.sentBadge') }}</span>
      </div>

      <input
        v-if="isEditing"
        ref="editInput"
        class="edit-input"
        :value="draftTitle"
        :disabled="disabled"
        @input="emit('update:draftTitle', $event.target.value)"
        @keyup.enter="emit('save-edit', task)"
        @keyup.escape="emit('cancel-edit')"
      />
      <span v-if="isEditing && editError" class="field-error">{{ editError }}</span>
      <div v-else class="task-text">{{ task.title }}</div>

      <div class="task-meta">
        <span class="task-date">{{ task.formattedDate }}</span>
        <span v-if="task.hasShares && task.sharedWithSummary" class="task-date">
          {{ t('shared.sentTo', { names: task.sharedWithSummary }) }}
        </span>
        <span v-if="task.isShared && task.ownerDisplayName" class="task-date">
          {{ t('shared.by', { name: task.ownerDisplayName }) }}
        </span>
        <span v-if="task.isShared && task.formattedSharedDate" class="task-date">
          {{ t('shared.receivedOn', { date: task.formattedSharedDate }) }}
        </span>
      </div>
    </div>

    <div v-if="task.canManage" class="task-actions">
      <template v-if="isEditing">
        <button
          type="button"
          class="icon-btn confirm"
          :disabled="disabled"
          :title="t('actions.save')"
          @click="emit('save-edit', task)"
        >
          &#10003;
        </button>
        <button
          type="button"
          class="icon-btn danger"
          :disabled="disabled"
          :title="t('actions.cancel')"
          @click="emit('cancel-edit')"
        >
          &#215;
        </button>
      </template>
      <template v-else>
        <button
          v-if="task.canShare"
          type="button"
          class="share-btn"
          :disabled="disabled"
          @click="emit(isShareOpen ? 'cancel-share' : 'start-share', task)"
        >
          {{ isShareOpen ? t('actions.cancelShare') : t('actions.share') }}
        </button>
        <button
          type="button"
          class="icon-btn"
          :disabled="disabled"
          :title="t('actions.edit')"
          @click="emit('start-edit', task)"
        >
          &#9998;
        </button>
        <button
          type="button"
          class="icon-btn danger"
          :disabled="disabled"
          :title="t('actions.delete')"
          @click="emit('remove-task', task.id)"
        >
          &#215;
        </button>
      </template>
    </div>

    <div v-if="isShareOpen && task.canShare" class="task-share-panel">
      <label class="field-group">
        <span class="field-label">{{ t('shared.label') }}</span>
        <input
          :value="shareDraft"
          :disabled="disabled"
          :placeholder="t('shared.placeholder')"
          @input="emit('update:shareDraft', $event.target.value)"
          @keyup.enter="emit('confirm-share', task)"
          @keyup.escape="emit('cancel-share')"
        />
        <span v-if="shareError" class="field-error">{{ shareError }}</span>
      </label>

      <div class="task-share-actions">
        <button
          type="button"
          class="primary-btn share-confirm-btn"
          :disabled="disabled"
          @click="emit('confirm-share', task)"
        >
          {{ disabled ? t('actions.sharing') : t('actions.confirmShare') }}
        </button>
        <button
          type="button"
          class="clear-btn share-cancel-btn"
          :disabled="disabled"
          @click="emit('cancel-share')"
        >
          {{ t('actions.cancel') }}
        </button>
      </div>
    </div>
  </li>
</template>
