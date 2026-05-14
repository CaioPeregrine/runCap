import { Race } from '../types/Race';

// Retorna a corrida mais próxima a partir de hoje (inclusive)
export function getNextRace(races: Race[]): Race | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    races
      .filter(r => new Date(r.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
  );
}

// Quantos dias faltam para a corrida (0 = hoje)
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = new Date(dateStr).getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Formata 'YYYY-MM-DD' para exibição: '14 de Maio de 2025'
export function formatDateLong(dateStr: string): string {
  const months = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];
  const d = new Date(dateStr);
  return `${d.getDate() + 1} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

// Monta o objeto 'markedDates' que o react-native-calendars espera
export function buildMarkedDates(
  races: Race[],
  selectedDate: string | null,
): Record<string, object> {
  const marked: Record<string, object> = {};

  races.forEach(r => {
    marked[r.date] = {
      marked: true,
      dotColor: '#97C459',
      customStyles: {
        container: { backgroundColor: '#27500A', borderRadius: 20 },
        text:      { color: '#C0DD97', fontWeight: '600' },
      },
    };
  });

  // Destaca o dia selecionado sem remover o estilo de corrida
  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] ?? {}),
      selected: true,
      selectedColor: marked[selectedDate] ? '#3B6D11' : '#dbeafe',
      selectedTextColor: marked[selectedDate] ? '#C0DD97' : '#1e40af',
    };
  }

  return marked;
}
