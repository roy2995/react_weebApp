import BarChart from './BarChart';

// Definir valores por defecto para los datos
const defaultData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  datasets: [
    {
      label: 'Ventas',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    },
  ],
};

export default {
  title: 'Charts/BarChart',
  component: BarChart,
  argTypes: {
    data: { control: 'object' }, // Permitir la modificación del objeto `data`
  },
};

// Crear una función de story con controles para modificar los datos
const Template = (args) => <BarChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: defaultData, // Valores por defecto, pero modificables desde los controles
};
