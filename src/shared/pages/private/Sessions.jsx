import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../config/axios";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { ScheduleSessionModal } from "../../components/session/ScheduleSessionModal";
import { COURSES, HOURS, PASTEL_THEMES } from "../../utils/constants";

export const Sessions = () => {

  //Definimos estados locales de sesion y students
  const [ sessions, setSessions] = useState([]);
  const [ students, setStudents] = useState([]);
  const [ isLoading, setIsLoading] = useState(true);

  //Fecha inicio de la semana
  const [ currentWeekStart, setCurrentWeekStart ] = useState( () => {

    //Calcula el lunes de la semana actual
    const today = new Date();
    const day = today.getDay(); // 0 para domingo, 1 para lunes...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que empiece en lunes (1)
    const monday = new Date(today.setDate(diff));
    // Establecemos a las 00:00
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  
  return (
    <div></div>
  )
}
