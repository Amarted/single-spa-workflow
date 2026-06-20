export type MessageType = 'success' | 'error' | 'warning' | 'info';
type Duration = number | 'always';
/**
 * Модальное окно с кнопками подтверждения и отмены, для внутреннего использования
 */
interface ModalWindow {
  /** Overlay (задний фон) модального окна */
  overlay: HTMLElement;
  /** Кнопка подтверждения */
  confirmButton: HTMLButtonElement;
  /** Кнопка отмены */
  cancelButton: HTMLButtonElement;
}

export class MessageService {
  /**
   * Показать тост с сообщением.
   * @param message Текст сообщения
   * @param type Тип сообщения
   * @param duration Продолжительность показа в мс
   */
  public showToast(message: string, type: MessageType = 'info', duration: Duration = 5000): void {
    const toastElement = this.createNotificationToast(message, type);

    this.mountNotificationToast(toastElement, duration);
  }

  /**
   * Показать модальное окно для подтверждения действия пользователем
   * @param title Заголовок окна
   * @param message Текст сообщения
   * @returns Promise<boolean> - результат подтверждения пользователем (true - подтвердил, false - отменил)
   */
  public async showConfirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createModalDialog(title, message);

      this.bindModalDialogListeners(
        modal,
        () => { this.cleanupAndResolve(modal.overlay, resolve, true); },
        () => { this.cleanupAndResolve(modal.overlay, resolve, false); }
      );

      document.body.appendChild(modal.overlay);
      modal.overlay.classList.add('is-visible');
      modal.cancelButton.focus();

      const globalEscapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (modal.overlay.classList.contains('is-visible')) {
            this.cleanupAndResolve(modal.overlay, resolve, false);
            document.removeEventListener('keydown', globalEscapeHandler);
          }
        }
      };

      document.addEventListener('keydown', globalEscapeHandler);
    });
  }

  /**
   * Создать уведомление с сообщением (toast).
   * @param message Текст сообщения
   * @param type Тип сообщения
   */
  private createNotificationToast(message: string, type: MessageType): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `notification-toast type-${type}`;

    // Иконка
    const iconSpan = document.createElement('span');
    iconSpan.className = 'notification-icon';
    iconSpan.textContent = this.getIconForMessageType(type);

    const textSpan = document.createTextNode(message);

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);

    return toast;
  }

  /**
   * Создать модальное окно (его структуру) для подтверждения действия пользователем.
   * @param title Заголовок окна
   * @param message Текст сообщения 
   * @returns Объект с элементами модального ока (фон, кнопки), для внутреннего использования (события)
   */
  private createModalDialog(title: string, message: string): ModalWindow {
    const overlay = document.createElement('div');
    overlay.className = 'modal-dialog-overlay';

    const windowContainer = document.createElement('div');
    windowContainer.className = 'modal-dialog-window';

    const header = document.createElement('div');
    header.className = 'modal-dialog-header';
    header.textContent = title;

    const body = document.createElement('div');
    body.className = 'modal-dialog-body';
    body.textContent = message;

    const footer = document.createElement('div');
    footer.className = 'modal-dialog-footer';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'button-cancel';
    cancelButton.textContent = 'Отмена';
    cancelButton.type = 'button';

    const confirmButton = document.createElement('button');
    confirmButton.className = 'button-confirm';
    confirmButton.textContent = 'OK';
    confirmButton.type = 'button';

    footer.appendChild(cancelButton);
    footer.appendChild(confirmButton);

    windowContainer.appendChild(header);
    windowContainer.appendChild(body);
    windowContainer.appendChild(footer);
    overlay.appendChild(windowContainer);

    return {
      overlay,
      confirmButton,
      cancelButton,
    };
  }

  /** 
   * Смонтировать уведомление с сообщением.
   * @param toast Уведомление
   * @param duration Время отображения уведомления в миллисекундах, или `always` если его не нужно убирать
   */
  private mountNotificationToast(toast: HTMLElement, duration: Duration): void {
    document.body.appendChild(toast);

    if (duration !== 'always') {
      setTimeout(() => {
        toast.classList.add('is-hiding');
        setTimeout(() => { toast.remove(); }, 300); // Ждем завершения CSS анимации
      }, duration);
    }
  }

  /**
   * Вешает все необходимые слушатели на элементы модального окна (кнопки, клик по фону, esc).
   * @param modal Модальное окно
   * @param onConfirm Обработчик нажатия на кнопку подтверждения
   * @param onCancel Обработчик нажатия на кнопку отмены
   */
  private bindModalDialogListeners(
    modal: ModalWindow,
    onConfirm: () => void,
    onCancel: () => void
  ): void {

    modal.cancelButton.addEventListener('click', (e) => {
      e.stopPropagation();
      onCancel();
    });

    modal.confirmButton.addEventListener('click', (e) => {
      e.stopPropagation();
      onConfirm();
    });

    // Клик вне окна (по затемненному фону) = Отмена
    modal.overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('modal-dialog-overlay')) {
        onCancel();
      }
    });

  }

  /**
   * Единая точка очистки DOM и завершения Promise.
   */
  private cleanupAndResolve(
    overlay: HTMLElement,
    resolve: (value: boolean) => void,
    result: boolean
  ): void {
    if (overlay.parentNode) {
      overlay.remove();
    }
    resolve(result);
  }

  private getIconForMessageType(type: MessageType): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '⚠';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  }
}

export const messageService = new MessageService();
