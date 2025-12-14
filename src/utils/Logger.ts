export class Logger {
  private container: HTMLElement;
  private maxEntries = 100;

  constructor() {
    this.container = document.getElementById('log-content')!;
  }

  private addEntry(message: string, type: 'event' | 'success' | 'warning' | 'error' | 'info' = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString();
    const time = document.createElement('span');
    time.className = 'log-timestamp';
    time.textContent = `[${timestamp}]`;
    
    const content = document.createElement('span');
    content.className = `log-${type}`;
    content.innerHTML = message;
    
    entry.appendChild(time);
    entry.appendChild(content);
    
    this.container.insertBefore(entry, this.container.firstChild);
    
    // Limita entradas
    while (this.container.children.length > this.maxEntries) {
      this.container.removeChild(this.container.lastChild!);
    }
  }

  event(message: string) {
    this.addEntry(message, 'event');
  }

  success(message: string) {
    this.addEntry(message, 'success');
  }

  warning(message: string) {
    this.addEntry(message, 'warning');
  }

  error(message: string) {
    this.addEntry(message, 'error');
  }

  info(message: string) {
    this.addEntry(message, 'info');
  }

  data(label: string, value: any) {
    const formatted = typeof value === 'object' 
      ? JSON.stringify(value, null, 2) 
      : value;
    this.addEntry(`${label}: <span class="log-data">${formatted}</span>`, 'info');
  }
}
