<script setup lang="ts">
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faFile, faTrashCan, faEdit } from '@fortawesome/free-regular-svg-icons';
import type { WorkflowStep } from '../../../root-config/src/shared/workflow/interfaces/WorkflowStep';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { messageService } from '@shared/MessageService';
import { storeToRefs } from 'pinia';
import { nextTick, reactive, ref } from 'vue';
import WorkflowNameStepNameEditor from './WorkflowStepNameEditor.vue';

/** Данные редактора имени шага */
interface EditNameData {
  show: boolean;
  stepIndex: number | null;
}

const fileIcon = icon(faFile).html;
const trashIcon = icon(faTrashCan).html; // faTrash без полосок в центре доступен в про, в free используем faTrashCan
const editIcon = icon(faEdit).html;
const tableBodyRef = ref<HTMLTableSectionElement | null>();
const isTableHighlighted = ref(false);
const editNameForm = reactive<EditNameData>({
  show: false,
  stepIndex: null,
});

const store = useWorkflowStore();
const { name, steps } = storeToRefs(store);
const { createStep, removeStep } = store;

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
      messageService.showToast('Состояние создано и добавлено в конец таблицы', 'success');
      highlightTable();
      scrollToTableLastRow();
    } else {
      messageService.showToast(`Ошибка: ${result.error.message}. Создание состояния отменено`, 'error');
    }
  } catch (error) {
    messageService.showToast('Что-то пошло не так. Создание состояния отменено', 'error');
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

  try {
    const result = await removeStep(name.value, step.initialIndex);

    if (result.ok) {
      messageService.showToast('Состояние удалено', 'success');
      highlightTable();
    } else {
      messageService.showToast(`Ошибка: ${result.error.message}. Удаление состояния отменено`, 'error');
    }
  } catch (error) {
    messageService.showToast('Что-то пошло не так. Удаление состояния отменено', 'error');
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
  // Сркыть форму
  editNameForm.stepIndex = null;
  editNameForm.show = false;
}


let highlightTableTimeout: number | undefined;
/** Подсветка таблицы, для акцента на изменения в ней (напримре добавление нового состояния) */
function highlightTable(): void {
  clearTimeout(highlightTableTimeout);
  // Включаем подсветку и отключаем через некоторое время
  isTableHighlighted.value = true;
  highlightTableTimeout = setTimeout(() => isTableHighlighted.value = false, 1200);
  ;
};

function scrollToTableLastRow(): void {
  nextTick(() => {
    const tbody = tableBodyRef.value;
    if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1] as HTMLElement;
      if (lastRow) {
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }); // убедиться, что DOM обновился

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
    const errorMessage = `Шаг с индексом ${index} не найден`;
    messageService.showToast(errorMessage, 'error');
    throw new Error(errorMessage);
  }

  return step;
}

</script>

<template>
  <div id="workflowTableComponentRoot">
    <!-- @todo Заменить на лоадер, с проверкой загрузки workflow -->
    <template v-if="store.name">
      <div class="header">
        <h3>Структура рабочего процесса "{{ store.name }}"</h3>
        <button @click="onCreateStepClick()">
          <svg class="icon-plus">
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
              >
                <!-- @todo Разбить на более мелкие компоненты -->
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
                    @submit="onNameChangeComplete()"
                    @cancel="onNameChangeComplete()"
                  ></WorkflowNameStepNameEditor>
                  <!-- <form @submit="onChangeNameSubmit(step)">
                    <input
                      type="text"
                      v-model="editNameForm.name"
                    />
                    <button type="submit">
                      <svg class="icon-check">
                        <use xlink:href="#icon-check"></use>
                      </svg>
                    </button>
                  </form> -->
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
                    <button @click="onRemoveStepClick(step)">
                      <span
                        class="icon"
                        v-html="trashIcon"
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

    <svg display="none">
      <defs>
        <symbol
          id="icon-plus"
          viewBox="0 0 448 512"
        >
          <!-- В установленом пакете @fontawesome free только плюс с контуром, используем svg для иконки без контура-->
          <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
          <path
            d="M256 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 160-160 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160 160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-160 0 0-160z"
          />
        </symbol>
        <symbol
          id="icon-check"
          viewBox="0 0 448 512"
        >
          <!-- Аналогично только check с контуром, используем svg без контура-->
          <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
          <path
            d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"
          />
        </symbol>
      </defs>
    </svg>
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

    tbody tr {
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