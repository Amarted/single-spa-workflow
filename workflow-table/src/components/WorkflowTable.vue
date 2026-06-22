<script setup lang="ts">
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faFile, faTrashCan, faEdit, } from '@fortawesome/free-regular-svg-icons';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { messageService } from '@shared/MessageService';
import { storeToRefs } from 'pinia';
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import WorkflowNameStepNameEditor from './WorkflowStepNameEditor.vue';

/** Данные редактора имени шага */
interface EditNameData {
  show: boolean;
  stepIndex: number | null;
  isNew: boolean;
}

const fileIcon = icon(faFile).html;
const trashIcon = icon(faTrashCan).html; // faTrash без полосок в центре доступен в про, в free используем faTrashCan
const editIcon = icon(faEdit).html;
const tableBodyRef = ref<HTMLTableSectionElement | null>();
const isTableHighlighted = ref(false);
const editNameForm = reactive<EditNameData>({
  show: false,
  stepIndex: null,
  isNew: false,
});

const store = useWorkflowStore();
const { name, steps, selectedStep } = storeToRefs(store);
const { createStep, removeStep, selectStep } = store;

onMounted(() => {
  document.addEventListener('keydown', handleDeleteKeyOnSelectedStep);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDeleteKeyOnSelectedStep);
});


/**
 * Удаление шага при нажатии Del на выделенном шаге
 * @param event Событие нажатия 
 */
function handleDeleteKeyOnSelectedStep(event: KeyboardEvent): void {
  if (event.key === 'Delete' && selectedStep.value !== null) {
    const stepToRemove = steps.value.find(s => s.initialIndex === selectedStep.value);
    if (stepToRemove) {
      void onRemoveStepClick(stepToRemove);
    }
  }
};

/** Генерирует уникальное имя для создания шага */
function generateStepName(steps: WorkflowStep[]): string {
  const usedNames = new Set(steps.map(step => step.name));

  // Берём общее кол-во шагов, с учётом нового
  let counter = steps.length + 1;
  while (true) {
    const name = `Шаг ${counter}`;
    if (!usedNames.has(name)) {
      return name;
    }
    // Имя существует - используем следующий номер шага
    counter++;
  }
}

/** 
 * Обработчик создания нового шага, при клике на кнопку.
 * 
 * Добавляет новый шаг в процесс, используя дефолтные значения:
 * - название (Шаг + <текущее количество шагов>, должна поддерживаться уникальность названий)
 * - координаты (0, 0)
 * - цвет (белый)
 */
async function onCreateStepClick(): Promise<void> {
  try {
    const result = await createStep(name.value, {
      name: generateStepName(steps.value),
      x: 0,
      y: 0,
      color: 'white',
      nextSteps: [],
    });

    if (result.ok) {
      messageService.showToast('Состояние создано', 'success');
      // Фокусируем пользователя на результате, показываем созданную строку
      highlightTable();
      void scrollToTableLastRow();
      const newStep = result.value;
      selectStep(newStep.initialIndex);
      // Сразу открываем редактор, и выделяем имя полностью
      editNameForm.isNew = true;
      onChangeNameClick(newStep);
    } else {
      messageService.showToast(`Ошибка: ${result.error.message}. Создание состояния отменено`, 'error');
    }
  } catch (error) {
    messageService.showToast('Что-то не так. Создание состояния отменено', 'error');
    // Кидаем дальше, для обработки/логирования
    throw error;
  }
}

/** 
 * Обработчик удаления шага, при клике на кнопку
 * @param step шаг, который нужно удалить
 */
async function onRemoveStepClick(step: WorkflowStep): Promise<void> {
  const userConfirmAction = await messageService.showConfirm('Удаление состояния', `Подтвердите удаление состояния "${step.name}"`);
  if (!userConfirmAction) {
    return;
  }

  // Находим индекс удаляемого шага в массиве, для дальнейшего выбора следующей/предыдущей строки, чтобы пользователь не терял фокус, на какой строке он был
  const stepIndexInArray = steps.value.findIndex(existingStep => existingStep.initialIndex === step.initialIndex);

  // Шаг должен быть всегда, что-то не так
  if (stepIndexInArray === -1) {
    messageService.showToast('Ошибка: шаг не найден в списке', 'error');
    return;
  }
  // Определяем, какой шаг выбрать после удаления
  let nextStepToSelect: WorkflowStep | null = null;
  if (steps.value.length > 1) {
    // Если это был последний — берем предыдущий, иначе — следующий
    if (stepIndexInArray === steps.value.length - 1) {
      nextStepToSelect = steps.value[stepIndexInArray - 1];
    } else if (stepIndexInArray > 0) {
      nextStepToSelect = steps.value[stepIndexInArray + 1]; // следующий
    }
  }

  try {
    const result = await removeStep(name.value, step.initialIndex);

    if (result.ok) {
      messageService.showToast('Состояние удалено', 'success');
      highlightTable();
      // Выделяем следующий/предыдущий шаг
      if (nextStepToSelect) {
        selectStep(nextStepToSelect.initialIndex);
      }
    } else {
      messageService.showToast(`Ошибка: ${result.error.message}. Удаление состояния отменено`, 'error');
    }
  } catch (error) {
    messageService.showToast('Что-то не так. Удаление состояния отменено', 'error');
    // Кидаем дальше, для обработки/логирования
    throw error;
  }
}

/**
 * Обработчик клика на редактирование имени
 * @param step шаг, который нужно редактировать 
 */
async function onChangeNameClick(step: WorkflowStep): Promise<void> {
  // Отобразить форму редактирования
  editNameForm.stepIndex = step.initialIndex;
  editNameForm.show = true;
}

/** Обработчик завершения редактирования имени  */
function onNameChangeComplete(): void {
  // Скрыть форму
  editNameForm.stepIndex = null;
  editNameForm.show = false;
  editNameForm.isNew = false;
}


let highlightTableTimeout: number | undefined;
/** Подсветка таблицы, для акцента на изменения в ней (например добавление нового состояния) */
function highlightTable(): void {
  clearTimeout(highlightTableTimeout);
  // Включаем подсветку и отключаем через некоторое время
  isTableHighlighted.value = true;
  highlightTableTimeout = setTimeout(() => isTableHighlighted.value = false, 1200);
  ;
};

async function scrollToTableLastRow(): Promise<void> {
  await nextTick();
  const tbody = tableBodyRef.value;
  if (tbody) {
    const rows = tbody.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1] as HTMLElement;
    if (lastRow) {
      lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/** 
 * Получения списка самих шагов, по списку их индексов
 * @param nextSteps - список индексов шагов
 * @returns список шагов
 */
function getNextSteps(nextSteps: WorkflowStep['nextSteps']): WorkflowStep[] {
  return nextSteps.map(nextStepIndex => getStepByIndex(nextStepIndex));
}

/** 
 * Получение данных шага по индексу 
 * @param index - индекс шага
 */
function getStepByIndex(index: number): WorkflowStep {
  const step = steps.value.find(step => step.initialIndex === index);
  if (!step) {
    // Все шаги должны существовать, что-то не так.
    console.warn(`Шаг с индексом ${index} не найден`);
    // Возвращаем заглушку. Альтернативно можем вернуть null, и не отображать вовсе, но тогда просто скроем проблему
    // Такое сейчас может быть при удалении шага, т.к. на сервере удалённый шаг, не удаляется из других nextSteps, ссылающихся на него
    return {
      initialIndex: index,
      name: `{Шаг №${index} удалён}`,
      x: 0,
      y: 0,
      nextSteps: [],
    }
  }

  return step;
}

</script>

<template>
  <div id="workflowTableComponentRoot">
    <!-- @todo Заменить на лоадер, с проверкой загрузки workflow -->
    <template v-if="name">
      <div class="header">
        <h3>Структура рабочего процесса "{{ name }}"</h3>
        <button
          @click="onCreateStepClick()"
          aria-label="Создать новое состояние"
        >
          <svg
            class="icon-plus"
            aria-hidden="true"
          >
            <use xlink:href="#icon-plus"></use>
          </svg>
          Создать состояние</button>
      </div>
      <div
        class="table-wrapper"
        :class="{ 'highlight-table': isTableHighlighted }"
      >
        <table>
          <thead>
            <tr>
              <th class="name-property">Состояние</th>
              <th class="coordinate-property">x</th>
              <th class="coordinate-property">y</th>
              <th class="next-steps-property">Переходы</th>
              <th class="controls"><!-- Controls --></th>
            </tr>
          </thead>
          <tbody ref="tableBodyRef">
            <template v-if="store.steps.length > 0">
              <tr
                v-for="step in store.steps"
                :key="step.initialIndex"
                :class="{ 'selected-step': step.initialIndex === selectedStep }"
                @click="selectStep(step.initialIndex)"
              >
                <td class="name-property">
                  <div
                    v-if="!editNameForm.show || editNameForm.stepIndex !== step.initialIndex"
                    @click="onChangeNameClick(step)"
                    class="edit-name-wrapper"
                    title="Нажмите для редактирования"
                  >
                    <span
                      class="icon edit-name-icon"
                      v-html="editIcon"
                    ></span>
                    <span
                      class="icon step-icon"
                      v-html="fileIcon"
                      :style="{ color: step.color }"
                    ></span>
                    <span class="step-name">
                      {{ step.name }}
                    </span>
                  </div>

                  <WorkflowNameStepNameEditor
                    v-if="editNameForm.show && editNameForm.stepIndex === step.initialIndex"
                    :step="step"
                    :is-new="editNameForm.isNew"
                    @submit="onNameChangeComplete()"
                    @cancel="onNameChangeComplete()"
                  ></WorkflowNameStepNameEditor>
                </td>
                <td class="coordinate-property">{{ step.x }}</td>
                <td class="coordinate-property">{{ step.y }}</td>
                <td class="next-steps-property">
                  <template
                    v-for="(nextStep, index) in getNextSteps(step.nextSteps)"
                  >
                    <span class="next-step">
                      <span
                        class="icon"
                        v-html="fileIcon"
                        :style="{ color: nextStep.color }"
                      ></span>
                      <span class="next-step-name">
                        {{ nextStep.name }}
                      </span>
                    </span>
                    <!-- Запятая, если не последний -->
                    <template v-if="index !== step.nextSteps.length - 1">,
                    </template>
                  </template>
                </td>
                <td class="controls">
                  <div class="controls-wrapper">
                    <button
                      @click="onRemoveStepClick(step)"
                      :aria-label="`Удалить состояние «${step.name}»`"
                    >
                      <span
                        class="icon"
                        v-html="trashIcon"
                        aria-hidden="true"
                      ></span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr class="empty-data">
                <td colspan="5">Список состояний пуст</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

    </template>
    <template v-else>
      <h3>Рабочий процесс загружается...</h3>
    </template>
  </div>
</template>

<style scoped lang="scss">
#workflowTableComponentRoot {
  padding: 100px 42px;

  .header {
    position: sticky;
    top: 0;
    z-index: 11;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-right: 15px;
    background-color: var(--bg-primary);
  }

  .icon-plus {
    margin-top: 2px;
    width: 12px;
    height: 12px;
    fill: var(--text-secondary);
  }

  .table-wrapper {
    &.highlight-table {
      animation: highlight-table var(--highlight-duration) ease-out;
      box-shadow: 0 0 0 0 transparent; // предотвращает "мерцание" при первом рендере
    }
  }

  table {
    table-layout: fixed;
    width: 100%;

    thead {
      position: sticky;
      top: 65px;
      z-index: 11;
    }

    td:not(.coordinate-property),
    .edit-name-wrapper {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .name-property {
      width: 40%;
    }

    .coordinate-property {
      text-align: right;
      width: 6%;
    }

    .next-steps-property {
      width: 45%;
    }

    .controls {
      width: 8%;
    }

    .controls-wrapper {
      display: flex;
      justify-content: end;
    }

    .name-property,
    .next-steps-property {
      .icon {
        margin-right: 8px;
      }
    }

    .selected-step {
      background-color: var(--gray-350);
    }

    tbody tr {
      cursor: pointer;

      .name-property {
        position: relative;

        .edit-name-wrapper {
          cursor: pointer;

          &:hover {
            border-bottom: 1px dotted black;

            .edit-name-icon {
              opacity: 1;
            }
          }


        }
      }

      .edit-name-icon {
        position: absolute;
        display: none;
        opacity: 0.4;
      }

      &:hover {
        background-color: var(--gray-200);

        .edit-name-icon {
          display: inline;
        }

        .step-icon {
          opacity: 0;
        }
      }
    }
  }
}

:root {
  --highlight-color: var(--color-success);
  --highlight-duration: 3s;
}

@keyframes highlight-table {
  0% {
    box-shadow: 0 0 0 0 transparent;
    transition: box-shadow var(--highlight-duration) ease-out;
  }

  20% {
    box-shadow: 0 0 0 8px var(--highlight-color);
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
    transition: box-shadow var(--highlight-duration) ease-out;
  }
}
</style>