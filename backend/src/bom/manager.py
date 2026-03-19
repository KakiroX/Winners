import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class BOMManager:
    """Consolidated logic for aggregating project-wide Bill of Materials."""
    
    @staticmethod
    def aggregate_walkthrough_bom(walkthrough_model) -> List[Dict]:
        """Aggregate BOM from the current version of all rooms in a single walkthrough."""
        total_bom = []
        for room in walkthrough_model.rooms:
            if not room.current_version_id:
                continue
            
            # Find the current version
            current_version = None
            for v in room.versions:
                if v.id == room.current_version_id:
                    current_version = v
                    break
            
            if current_version and current_version.bom:
                for item in current_version.bom:
                    item_copy = item.copy()
                    item_copy["room_label"] = room.room_label
                    total_bom.append(item_copy)
        return total_bom

    @staticmethod
    def aggregate_multi_walkthrough_bom(walkthrough_models: List) -> List[Dict]:
        """Aggregate BOM from multiple walkthroughs into a single list."""
        all_items = []
        for wt in walkthrough_models:
            wt_items = BOMManager.aggregate_walkthrough_bom(wt)
            for item in wt_items:
                item_copy = item.copy()
                item_copy["design_title"] = wt.title
                all_items.append(item_copy)
        return all_items
