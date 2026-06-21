<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, } from 'vue';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { messageService } from '../../../root-config/src/shared/MessageService';

const props = defineProps<{
  step: WorkflowStep;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const stepName = ref(props.step.name);
const errorMessage = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const formRef = ref<HTMLFormElement | null>(null);

const { changeStepName } = useWorkflowStore();

onMounted(() => {
  // Фокус на поле для удобвства
  inputRef.value?.focus();
  // Выделяем имя полностью если новый шаг
  if (props.isNew) {
    inputRef.value?.select();
  }
  // Отмена редактированя при клике вне формы
  const handleClickOutside = (event: MouseEvent) => {
    const form = formRef.value;
    if (!form || form.contains(event.target as Node)) {
      return;
    }
    emit('cancel');
  };

  document.addEventListener('mousedown', handleClickOutside);

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });
});

async function onSubmit(): Promise<void> {
  try {
    const newName = stepName.value.trim();
    if (newName === props.step.name) {
      emit('submit');
      return;
    }

    // Валидация происходит в сторе, просто проверяем на наличие ошибок валидации
    const result = await changeStepName(props.step.initialIndex, newName);
    if (result.ok) {
      messageService.showToast('Имя шага изменено', 'success');
      emit('submit');
    } else {
      errorMessage.value = result.error.message;
    }
  } catch (error) {
    messageService.showToast('Что-то пошло не так. Изменение имени шага отменено', 'error');
    emit('cancel');
  }

};

function onCancel(): void {
  emit('cancel');
};
</script>

<template>
  <form
    ref="formRef"
    @submit.prevent="onSubmit()"
    @reset.prevent="onCancel()"
    class="name-editor"
  >
    <div class="input-wrapper">
      <input
        type="text"
        v-model="stepName"
        @keyup.esc="onCancel()"
        ref="inputRef"
        :class="{ 'input-error': errorMessage }"
      />
      <button type="submit">
        <svg class="icon icon-check">
          <use xlink:href="#icon-check"></use>
        </svg>
      </button>
      <button type="reset">
        <svg class="icon icon-cancel">
          <use xlink:href="#icon-cancel"></use>
        </svg>
      </button>
    </div>
    <div
      class="error-message"
      v-if="errorMessage"
    >
      {{ errorMessage }}
    </div>
  </form>

</template>

<style scoped lang="scss">
form.name-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .input-wrapper {
    display: flex;
    gap: 8px;
  }

  .icon-check,
  .icon-cancel {
    margin-top: 2px;
    width: 12px;
    height: 12px;
    fill: var(--text-secondary);
  }

  .error-message {
    color: var(--color-error);
    font-size: 0.8rem;
  }
}
</style>