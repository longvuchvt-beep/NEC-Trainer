import React from 'react';
import InteractiveExamWorkspace, {
  isQuestionCorrect
} from '../../components/exam/InteractiveExamWorkspace';

export { isQuestionCorrect };

export default function ExamRoomModal(props) {
  return <InteractiveExamWorkspace {...props} />;
}
