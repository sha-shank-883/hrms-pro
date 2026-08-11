import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical } from 'react-icons/fa';

const DraggableWidget = ({ id, children, style: propStyle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        height: '100%',
        ...propStyle
    };

    return (
        <div ref={setNodeRef} style={style} className="draggable-widget-container">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="drag-handle absolute top-[10px] right-[10px] z-10 cursor-grab p-[5px] bg-white/70 dark:bg-gray-800/80 rounded text-neutral-400"
                title="Drag to reorder"
            >
                <FaGripVertical />
            </div>

            {/* Widget Content */}
            <div style={{ height: '100%' }}>
                {children}
            </div>
        </div>
    );
};

export default DraggableWidget;
