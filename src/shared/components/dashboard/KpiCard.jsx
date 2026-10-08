import React from 'react'

export const KpiCard = ({title, value, subtitle, isLoading, theme = "green"}) => {

  //Definimos los estilos de la tarjeta
  const styles = {
    green: { bg: "bg-[#EBF5EE]", border: "border-[#D8EBE0]", text: "text-[#529471]", valText: "text-[#3E885F]"},
    blue:  { bg: "bg-[#EEF6FC]", border: "border-[#D5E6F5]", text: "text-[#4A86B8]", valText: "text-[#3D719C]" },
    coral: { bg: "bg-[#FDF1EE]", border: "border-[#FADCD5]", text: "text-[#E07A5F]", valText: "text-[#D65F41]"}
  }

  const currentTheme = styles[theme] || styles.green;


  return (
    <div className={`${currentTheme.bg} p-6 rounded-3xl border ${currentTheme.border}`}>
        <p className={`text-sm font-bold uppercase tracking-wider ${currentTheme.text} mb-2`}>
            {title}
        </p>

        <p className={`text-3xl tracking-wider font-semibold ${currentTheme.valText || currentTheme.text}`}>
            {isLoading ? "..." : value}
        </p>

        <p className={`text-xs ${currentTheme.text} mt-1 font-medium`}>
            {subtitle}
        </p>

    </div>
  )
}
