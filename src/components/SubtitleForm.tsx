import { useState, useEffect } from "react";
import {
  FormControl,
  FormLabel,
  Input as ChakraInput,
  Select,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Box,
  IconButton,
  Flex,
  Tooltip,
} from "@chakra-ui/react";
import { TimeIcon } from "@chakra-ui/icons";

type Position = "top" | "bottom" | "middle";

export type Subtitle = {
  text: string;
  startTime: number;
  endTime: number;
  fontSize: number;
  fontColor: string;
  position: Position;
};

interface SubtitleFormProps {
  onAddSubtitle: (subtitle: Subtitle) => void;
  subtitleToEdit?: Subtitle;
  onEditSubtitle?: (subtitle: Subtitle) => void;
  videoDuration: number;
  videoCurrentTime: number; // 추가
  onChange?: (subtitle: Subtitle) => void; // 추가
}

const SubtitleForm = ({
  onAddSubtitle,
  subtitleToEdit,
  onEditSubtitle,
  videoDuration,
  videoCurrentTime,
  onChange,
}: SubtitleFormProps) => {
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [position, setPosition] = useState<Position>("middle");
  const [currentTimeOffset, setCurrentTimeOffset] = useState(1);

  const handleSetCurrentTime = () => {
    setStartTime(videoCurrentTime);
    setEndTime(videoCurrentTime + currentTimeOffset);
  };

  // 편집 모드 지원 및 입력 변경 시 부모로 전달
  useEffect(() => {
    if (subtitleToEdit) {
      setText(subtitleToEdit.text);
      setStartTime(subtitleToEdit.startTime);
      setEndTime(subtitleToEdit.endTime);
      setFontSize(subtitleToEdit.fontSize);
      setFontColor(subtitleToEdit.fontColor);
      setPosition(subtitleToEdit.position);
    } else {
      // 새 자막일 경우 초기화
      setText("");
      setStartTime(0);
      setEndTime(0);
      setFontSize(24);
      setFontColor("#FFFFFF");
      setPosition("middle");
    }
  }, [subtitleToEdit]);

  // 입력 변경 시 부모로 전달
  useEffect(() => {
    if (onChange) {
      onChange({
        text,
        startTime,
        endTime,
        fontSize,
        fontColor,
        position,
      });
    }
  }, [text, startTime, endTime, fontSize, fontColor, position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSubtitle = {
      text,
      startTime,
      endTime,
      fontSize,
      fontColor,
      position,
    };
    if (subtitleToEdit && onEditSubtitle) {
      onEditSubtitle(newSubtitle);
    } else {
      onAddSubtitle(newSubtitle);
    }

    // 입력 필드 초기화
    setText("");
    setStartTime(0);
    setEndTime(0);
    setFontSize(24);
    setFontColor("#FFFFFF");
    setPosition("bottom");
  };

  return (
    <Box as="form" onSubmit={handleSubmit} mt={4}>
      <FormControl mb={4}>
        <FormLabel>자막</FormLabel>
        <ChakraInput
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>자막 시작: {startTime.toFixed(1)}s</FormLabel>
        <Flex>
          <Tooltip
            label="현재 시간으로 설정"
            aria-label="Set current time"
            placement="top"
          >
            <IconButton
              onClick={handleSetCurrentTime}
              aria-label="Set current time"
              icon={<TimeIcon />}
              size="sm"
            />
          </Tooltip>
          <Tooltip
            label="이 항목을 수정하면, '현재 시간으로 설정' 버튼을 눌렀을 때, 자막 끝 시간이 숫지만큼 증가합니다."
            aria-label="Current time offset"
            placement="top"
          >
            <ChakraInput
              ml={2}
              size="sm"
              type="number"
              value={currentTimeOffset}
              onChange={(e) => setCurrentTimeOffset(Number(e.target.value))}
              min={0}
              step={0.1}
            />
          </Tooltip>
        </Flex>

        <Slider
          min={0}
          max={videoDuration}
          step={0.1}
          value={startTime}
          onChange={(val) => setStartTime(val)}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>자막 끝: {endTime.toFixed(1)}s</FormLabel>
        <Slider
          min={videoCurrentTime}
          max={videoDuration}
          step={0.1}
          value={endTime}
          onChange={(val) => setEndTime(val)}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Font Size</FormLabel>
        <ChakraInput
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          min={10}
          max={100}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Font Color</FormLabel>
        <ChakraInput
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Position</FormLabel>
        <Select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position)}
        >
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </Select>
      </FormControl>

      <Button type="submit" colorScheme="teal">
        {subtitleToEdit ? "Update Subtitle" : "Add Subtitle"}
      </Button>
    </Box>
  );
};

export default SubtitleForm;
