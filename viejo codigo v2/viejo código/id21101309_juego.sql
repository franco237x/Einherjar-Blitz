-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 13-07-2024 a las 02:41:21
-- Versión del servidor: 10.5.20-MariaDB
-- Versión de PHP: 7.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `id21101309_juego`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Precio_Esferas` int(11) NOT NULL,
  `Stock` int(11) NOT NULL,
  `Imagen_URL` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`ID`, `Nombre`, `Precio_Esferas`, `Stock`, `Imagen_URL`) VALUES
(42, 'Teigu: Murasame', 300, 1, 'https://i.pinimg.com/originals/af/64/3f/af643f6558e79d9f53e2d2855c75fb6b.jpg'),
(45, 'Invocación Mitica: Kokushibo', 150, 1, 'https://i.pinimg.com/236x/c2/14/15/c214151acbb9aca01191de17cf49dd93.jpg'),
(46, 'Libro Exclusivo: Griffith', 350, 0, 'https://i.pinimg.com/originals/fd/1a/aa/fd1aaabe4b310a19e109b3567e58456f.jpg'),
(47, 'Cofre Misterioso Mejorado', 80, 0, 'https://img.freepik.com/fotos-premium/misterioso-cofre-tesoro_863013-113912.jpg?w=740');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas_usuario`
--

CREATE TABLE `recompensas_usuario` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `recompensa_obtenida` varchar(100) NOT NULL,
  `fecha_obtencion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `unique_id` varchar(100) NOT NULL,
  `jefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `megajefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `horas_jugadas` int(11) NOT NULL DEFAULT 0,
  `rango` varchar(50) NOT NULL DEFAULT 'Sin Rango',
  `llaves` int(11) NOT NULL DEFAULT 0,
  `recompensas` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `unique_id`, `jefes_derrotados`, `megajefes_derrotados`, `horas_jugadas`, `rango`, `llaves`, `recompensas`) VALUES
(1, 'fran', '1234', 2, 0, 0, 'Sin Rango', 4, 25),
(2, 'Esteban', '21005', 0, 0, 0, 'Sin Rango', 1, 0),
(3, 'Rubiuh ', 'RUBIUSPRO1000YT', 350, 200, 0, 'Maestro', 0, 30),
(5, 'Jose', '281320', 0, 0, 0, 'Sin Rango', 0, 15),
(7, 'Sangel', 'GamerKing777', 0, 0, 0, 'Sin Rango', 0, 30),
(8, 'Jorge ', '22022001', 351, 200, 0, 'Maestro', 0, 145),
(10, 'Xair', '201010', 0, 94, 0, 'Sin Rango', 0, 10),
(11, 'Santiago ', '120408', 0, 0, 0, 'Sin Rango', 1, 0),
(12, 'Panoli', 'Andry', 350, 219, 0, 'Maestro', 0, 145),
(13, 'LaCarambinaDeAmbrosio', '270412', 5, 0, 0, 'Sin Rango', 0, 30),
(14, 'Alister', '32684', 1, 50, 0, 'Bronce', 5, 5),
(16, 'Ryoko', 'Ryoko1', 0, 0, 0, 'Sin Rango', 0, 115),
(17, 'Xolaani ', '98543', 0, 0, 0, 'Sin Rango', 0, 40),
(18, 'Alex ', '2504', 1, 6, 0, 'Bronce', 1, 90),
(20, 'Pollito', 'Findel15', 15, 0, 0, 'Sin Rango', 0, 15),
(21, 'Onji777', '2233322', 0, 0, 0, 'Sin Rango', 0, 50),
(22, 'Jeffito', 'Lopez32', 0, 0, 0, 'Sin Rango', 1, 0),
(23, 'Alisson', 'Alisson', 0, 1, 0, 'Sin Rango', 0, 0),
(24, 'Dinopapu', 'Dinopapu58', 0, 3, 0, 'Sin Rango', 0, 25),
(25, 'Bānd', 'Bānd', 0, 0, 0, 'Sin Rango', 1, 0),
(26, 'Taiyo', '242505', 2, 0, 0, 'Sin Rango', 0, 35),
(28, 'Espíndola ', 'Jaeb2778', 0, 0, 0, 'Sin Rango', 1, 0),
(29, 'Drealworl4', 'Dryalpaga', 0, 0, 0, 'Sin Rango', 1, 0),
(30, 'Failoen ', '694201987911', 0, 0, 0, 'Sin Rango', 1, 0),
(31, 'Jefflarata', '1049290', 0, 0, 0, 'Sin Rango', 1, 0),
(33, 'Helen', 'Helenguro', 0, 0, 0, 'Plata', 1, 0),
(36, 'SakuretZuazola1200', 'Antonio', 1, 2, 0, 'Bronce', 0, 120),
(37, 'Fayloen', 'YoNoLoDescargoPorqueYaLoTengo', 0, 0, 0, 'Sin Rango', 1, 0),
(39, 'Lazar', 'Lazar', 43, 1, 0, 'Bronce', 0, 55),
(40, 'Bocha', '123456789', 0, 0, 0, 'Bronce', 1, 0),
(106, 'SwanDancer', 'MemoriesChange07', 23, 11, 0, 'Plata', 21, 0),
(107, 'GiomarlolXD', 'Giomar12', 39, 10, 0, 'Plata', 1, 0),
(108, 'nakko', '123456', 0, 0, 0, 'Sin Rango', 1, 0),
(109, 'Ninomae', 'Ameliaina02', 1, 1, 0, 'Bronce', 0, 35);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `unique_id` (`unique_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=334;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  ADD CONSTRAINT `recompensas_usuario_ibfk_1` FOREIGN KEY (`username`) REFERENCES `usuarios` (`username`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
