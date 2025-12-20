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
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    cursor: 'grab',
                    padding: '5px',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '4px',
                    color: '#9ca3af'
                }}
                className="drag-handle"
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
