import RadarChart from './RadarChart';

const defaultData = {
  labels: ['Comer', 'Beber', 'Dormir', 'Diseñar', 'Codificar', 'Ciclismo', 'Correr'],
  datasets: [
    {
      label: 'Mis datos',
      data: [65, 59, 90, 81, 56, 55, 40],
      fill: true,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgb(75, 192, 192)',
      pointBackgroundColor: 'rgb(75, 192, 192)',
    },
  ],
};

export default {
  title: 'Charts/RadarChart',
  component: RadarChart,
  argTypes: {
    data: { control: 'object' }, // Permitir modificación del objeto `data`
  },
};

const Template = (args) => <RadarChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  data: defaultData, // Datos por defecto que se pueden modificar desde los controles
};
