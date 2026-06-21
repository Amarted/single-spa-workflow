<script setup lang="ts">
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faFile, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import type { WorkflowStep } from '../../../root-config/src/shared/workflow/interfaces/WorkflowStep';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { messageService } from '@shared/MessageService';
import { storeToRefs } from 'pinia';

const fileIcon = icon(faFile).html;
const trashIcon = icon(faTrashCan).html; // faTrash без полосок в центре доступен в про, в free используем faTrashCan
const store = useWorkflowStore();
const { name, steps } = storeToRefs(store);
const { createStep, removeStep, changeStepName } = store;

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
 * @param step - шаг, который нужно удалить
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
        <tbody>
          <template v-if="store.steps.length > 0">
            <tr
              v-for="step in store.steps"
              :key="step.initialIndex"
            >
              <td class="name-property">
                <span
                  class="icon"
                  v-html="fileIcon"
                  :style="{ color: step.color }"
                ></span>
                {{ step.name }}
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
                    {{ nextStep.name }}
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
          <!-- В установленом пакете @fontawesome только плюс с контуром, используем svg-->
          <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
          <path
            d="M256 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 160-160 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160 160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-160 0 0-160z"
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
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-right: 15px;
  }

  .icon-plus {
    margin-top: 2px;
    width: 12px;
    height: 12px;
    fill: var(--text-secondary);
  }

  table {
    table-layout: fixed;
    width: 100%;

    thead tr {
      position: sticky;
      top: 0;
    }

    td:not(.coordinate-property) {
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
        margin-right: 4px;
      }
    }
  }
}
</style>